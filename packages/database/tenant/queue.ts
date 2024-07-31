import { and, eq, lte } from "drizzle-orm";
import {
  defer,
  from,
  Subject,
  timer,
  type Observable,
  type Subscription,
} from "rxjs";
import { groupBy, mergeMap, repeat, takeUntil } from "rxjs/operators";

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
      lockDuration: config.lockDuration || 60000,
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
        mergeMap(() => this.processPendingEvents()),
        repeat(),
      )
      .subscribe({
        error: (err) => console.error("Error processing events:", err),
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
    const lockUntil = new Date(now.getTime() + this.config.lockDuration);

    return await this.db.transaction(async (tx) => {
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

      const events: ProcessingEvent[] = [];

      for (const { machineId } of distinctMachines) {
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
          events.push(nextEvent);

          await tx.insert(processingEvents).values({
            ...nextEvent,
            lockedUntil: lockUntil,
          });

          await tx
            .delete(queuedEvents)
            .where(eq(queuedEvents.id, nextEvent.id));
        }
      }

      return events;
    });
  }

  private async markEventAsProcessing(event: ProcessingEvent): Promise<void> {
    // This method is now a no-op because we've already moved the event to the processing table
    // We keep it for potential future use or logging
  }

  getEventStream(): Observable<ProcessingEvent> {
    return this.eventSubject.asObservable();
  }
  async completeEvent(eventId: string, success: boolean): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(processingEvents)
        .where(eq(processingEvents.id, eventId));

      if (!event) {
        throw new Error(`No processing event found with id ${eventId}`);
      }

      await tx.insert(processedEvents).values({
        ...event,
        status: success ? "complete" : "failed",
      });

      await tx.delete(processingEvents).where(eq(processingEvents.id, eventId));

      if (!success && event.attempts < event.maxAttempts) {
        await tx.insert(queuedEvents).values({
          ...event,
          attempts: event.attempts + 1,
          scheduledFor: new Date(Date.now() + 5 * 60000), // 5 minutes later
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
          });
          await tx
            .delete(processingEvents)
            .where(eq(processingEvents.id, event.id));
        } else {
          await tx.insert(queuedEvents).values({
            ...event,
            attempts: event.attempts + 1,
            scheduledFor: new Date(Date.now() + 5 * 60000), // 5 minutes later
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
