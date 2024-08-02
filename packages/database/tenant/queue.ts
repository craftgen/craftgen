import { add } from "date-fns";
import { and, eq, lte } from "drizzle-orm";
import {
  defer,
  from,
  Subject,
  timer,
  type Observable,
  type Subscription,
} from "rxjs";
import {
  catchError,
  groupBy,
  mergeMap,
  repeat,
  takeUntil,
} from "rxjs/operators";

import { type TenantDb } from "../lib/client-org-local.ts";
import {
  processedEvents,
  processingEvents,
  queuedEvents,
} from "../tenant/schema/index.ts";

interface EventProcessorConfig {
  lockDuration?: number;
  maxConcurrentMachines?: number;
  batchSize?: number;
  cleanupInterval?: number;
  pollingInterval?: number;
}
export type ProcessingEvent = typeof processingEvents.$inferSelect;

// Event Processor Class
export class EventProcessor {
  private db: TenantDb;
  private eventSubject: Subject<ProcessingEvent>;
  private config: Required<EventProcessorConfig>;
  private cleanupSubscription: Subscription | null = null;
  private processingSubscription: Subscription | null = null;
  private shutdownSubject: Subject<void> = new Subject<void>();

  constructor(db: TenantDb, config: EventProcessorConfig = {}) {
    this.db = db;
    this.eventSubject = new Subject<ProcessingEvent>();
    this.config = {
      lockDuration: config.lockDuration || 10,
      maxConcurrentMachines: config.maxConcurrentMachines || 10,
      batchSize: config.batchSize || 100,
      cleanupInterval: config.cleanupInterval || 300000,
      pollingInterval: config.pollingInterval || 1000,
    };
  }
  start(): void {
    this.startCleanupInterval();
    this.startProcessing();
  }
  private startCleanupInterval() {
    this.cleanupSubscription = timer(0, this.config.cleanupInterval)
      .pipe(
        takeUntil(this.shutdownSubject),
        mergeMap(() => defer(() => this.cleanupStalledEvents())),
      )
      .subscribe({
        error: (err) => console.error("Error cleaning up stalled events:", err),
      });
  }

  private startProcessing() {
    this.processingSubscription = timer(0, this.config.pollingInterval)
      .pipe(
        takeUntil(this.shutdownSubject),
        mergeMap(() =>
          this.processPendingEvents().pipe(
            catchError((error) => {
              console.error("Error processing events:", error);
              return [];
            }),
          ),
        ),
        repeat(),
      )
      .subscribe({
        error: (err) =>
          console.error("Unhandled error in event processing:", err),
      });
  }

  async enqueueEvent(
    eventData: Omit<typeof queuedEvents.$inferInsert, "id" | "createdAt">,
  ): Promise<void> {
    await this.db.insert(queuedEvents).values({
      ...eventData,
      scheduledFor: eventData.scheduledFor || new Date(),
    });
  }

  private processPendingEvents(): Observable<void> {
    return defer(() => this.fetchAndLockEvents()).pipe(
      mergeMap((events) => from(events)),
      groupBy((event) => event.machineId),
      mergeMap(
        (group) =>
          group.pipe(
            mergeMap((event) => {
              this.eventSubject.next(event);
              return defer(() => this.markEventAsProcessing(event));
            }, 1), // Ensure sequential processing within each machine
          ),
        this.config.maxConcurrentMachines,
      ),
    );
  }

  private async fetchAndLockEvents(): Promise<ProcessingEvent[]> {
    const now = new Date();
    const lockUntil = add(now, { seconds: this.config.lockDuration });

    try {
      return await this.db.transaction(async (tx) => {
        const events: ProcessingEvent[] = [];

        // Select distinct machineIds that are ready for processing
        const distinctMachines = await tx
          .selectDistinct({ machineId: queuedEvents.machineId })
          .from(queuedEvents)
          .where(
            and(
              lte(queuedEvents.scheduledFor, now),
              lte(queuedEvents.attempts, queuedEvents.maxAttempts),
            ),
          )
          .limit(this.config.maxConcurrentMachines);

        for (const { machineId } of distinctMachines) {
          try {
            // Check if there's already a processing event for this machine
            const [existingProcessingEvent] = await tx
              .select()
              .from(processingEvents)
              .where(eq(processingEvents.machineId, machineId))
              .limit(1);

            if (existingProcessingEvent) {
              // If the existing event is locked, skip this machine
              if (existingProcessingEvent.lockedUntil > now) {
                console.log(
                  `Skipping events for machine ${machineId} as it's already processing an event.`,
                );
                continue;
              }
              // If the lock has expired, delete the existing processing event
              await tx
                .delete(processingEvents)
                .where(eq(processingEvents.id, existingProcessingEvent.id));
            }

            // Select the next event for this machine
            const [nextEvent] = await tx
              .select()
              .from(queuedEvents)
              .where(
                and(
                  eq(queuedEvents.machineId, machineId),
                  lte(queuedEvents.scheduledFor, now),
                  lte(queuedEvents.attempts, queuedEvents.maxAttempts),
                ),
              )
              .orderBy(queuedEvents.createdAt)
              .limit(1);

            if (nextEvent) {
              // Insert the new processing event
              await tx.insert(processingEvents).values({
                ...nextEvent,
                lockedUntil: lockUntil,
                processingStartedAt: now,
              });

              // Remove from queued_events
              await tx
                .delete(queuedEvents)
                .where(eq(queuedEvents.id, nextEvent.id));

              events.push({
                ...nextEvent,
                lockedUntil: lockUntil,
                processingStartedAt: now,
              });
            }
          } catch (error) {
            console.error(
              `Error processing event for machine ${machineId}:`,
              error,
            );
            // Optionally, you could update the event's scheduled time to try again later
            await tx
              .update(queuedEvents)
              .set({ scheduledFor: add(now, { seconds: 60 }) }) // Try again in 1 minute
              .where(eq(queuedEvents.machineId, machineId));
          }
        }

        return events;
      });
    } catch (error) {
      console.error("Error in fetchAndLockEvents:", error);
      return [];
    }
  }

  private async markEventAsProcessing(event: ProcessingEvent): Promise<void> {
    // This method is now a no-op because we've already moved the event to the processing table
    // We keep it for potential future use or logging
  }

  getEventStream(): Observable<ProcessingEvent> {
    return this.eventSubject.asObservable();
  }
  async completeEvent(eventId: string, success: boolean): Promise<void> {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(processingEvents)
        .where(eq(processingEvents.id, eventId));

      if (!event) {
        console.log(
          `Event ${eventId} not found in processing_events. It may have already been processed.`,
        );
        return; // Exit gracefully instead of throwing an error
      }

      const processingDuration =
        now.getTime() - event.processingStartedAt.getTime();

      await tx.insert(processedEvents).values({
        ...event,
        status: success ? "complete" : "failed",
        processedAt: now,
        processingDuration,
      });

      await tx.delete(processingEvents).where(eq(processingEvents.id, eventId));

      if (!success && event.attempts < event.maxAttempts) {
        const nextAttempt = event.attempts + 1;
        const backoffTime = Math.pow(2, nextAttempt - 1); // Exponential backoff starting from 1 second
        const scheduledFor = add(now, { seconds: backoffTime });

        await tx.insert(queuedEvents).values({
          ...event,
          attempts: nextAttempt,
          scheduledFor,
        });
      }
    });
  }

  private async cleanupStalledEvents(): Promise<void> {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      const stalledEvents = await tx
        .select()
        .from(processingEvents)
        .where(lte(processingEvents.lockedUntil, now));

      for (const event of stalledEvents) {
        if (event.attempts >= event.maxAttempts) {
          await tx.insert(processedEvents).values({
            ...event,
            status: "failed",
            processedAt: now,
            processingDuration:
              now.getTime() - event.processingStartedAt.getTime(),
          });
          await tx
            .delete(processingEvents)
            .where(eq(processingEvents.id, event.id));
        } else {
          const nextAttempt = event.attempts + 1;
          const backoffTime = Math.pow(2, nextAttempt - 1); // Exponential backoff starting from 1 second
          const scheduledFor = add(now, { seconds: backoffTime });

          await tx.insert(queuedEvents).values({
            ...event,
            status: "retrying",
            attempts: nextAttempt,
            scheduledFor,
          });
          await tx
            .delete(processingEvents)
            .where(eq(processingEvents.id, event.id));
        }
      }
    });
  }

  async getEventsByMachineId(
    machineId: string,
  ): Promise<
    (
      | typeof queuedEvents.$inferSelect
      | typeof processingEvents.$inferSelect
      | typeof processedEvents.$inferSelect
    )[]
  > {
    const [queued, processing, processed] = await Promise.all([
      this.db
        .select()
        .from(queuedEvents)
        .where(eq(queuedEvents.machineId, machineId)),
      this.db
        .select()
        .from(processingEvents)
        .where(eq(processingEvents.machineId, machineId)),
      this.db
        .select()
        .from(processedEvents)
        .where(eq(processedEvents.machineId, machineId)),
    ]);

    return [...queued, ...processing, ...processed].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async shutdown(): Promise<void> {
    console.log("Shutting down EventProcessor...");
    this.shutdownSubject.next();
    this.shutdownSubject.complete();

    if (this.cleanupSubscription) {
      this.cleanupSubscription.unsubscribe();
    }
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
    }

    // Wait for any ongoing processing to complete
    await new Promise<void>((resolve) => {
      if (this.eventSubject.observed) {
        const subscription = this.eventSubject.subscribe({
          complete: () => {
            subscription.unsubscribe();
            resolve();
          },
        });
        this.eventSubject.complete();
      } else {
        resolve();
      }
    });

    console.log("EventProcessor shutdown complete.");
  }
}
