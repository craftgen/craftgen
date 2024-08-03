import { add } from "date-fns";
import {
  and,
  desc,
  eq,
  gt,
  isNull,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
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
  toArray,
} from "rxjs/operators";

import { type TenantDb } from "../lib/client-org-local.ts";
import {
  events,
  processedEvents,
  type ActorEvent,
} from "../tenant/schema/index.ts";

interface EventProcessorConfig {
  lockDuration?: number;
  maxConcurrentMachines?: number;
  cleanupInterval?: number;
  pollingInterval?: number;
}

// Event Processor Class
export class EventProcessor {
  private db: TenantDb;
  private eventSubject: Subject<ActorEvent[]>;
  private config: Required<EventProcessorConfig>;
  private cleanupSubscription: Subscription | null = null;
  private processingSubscription: Subscription | null = null;
  private shutdownSubject: Subject<void> = new Subject<void>();

  constructor(db: TenantDb, config: EventProcessorConfig = {}) {
    this.db = db;
    this.eventSubject = new Subject<ActorEvent[]>();
    this.config = {
      lockDuration: config.lockDuration || 10,
      maxConcurrentMachines: config.maxConcurrentMachines || 10,
      cleanupInterval: config.cleanupInterval || 1000,
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
    eventData: Omit<typeof events.$inferInsert, "id" | "createdAt" | "status">,
  ): Promise<void> {
    await this.db.insert(events).values({
      ...eventData,
      status: "queued",
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
            toArray(),
            mergeMap((events) => {
              this.eventSubject.next(events);
              return [];
            }),
          ),
        this.config.maxConcurrentMachines,
      ),
    );
  }

  private async fetchAndLockEvents(): Promise<ActorEvent[]> {
    const now = new Date();
    const lockUntil = add(now, { seconds: this.config.lockDuration });
    console.log("FETCHING");

    try {
      return await this.db.transaction(async (tx) => {
        // Subquery to get machineIds that are currently being processed
        const activeMachineIds = await tx
          .selectDistinct({ machineId: events.machineId })
          .from(events)
          .where(
            and(eq(events.status, "processing"), gt(events.lockedUntil!, now)),
          );

        console.log("ACTIVE MACHINE IDS", activeMachineIds);

        // Main query to fetch and lock events
        const result = await tx
          .update(events)
          .set({
            status: "processing",
            lockedUntil: lockUntil,
            processingStartedAt: now,
          })
          .where(
            and(
              or(eq(events.status, "queued"), eq(events.status, "retrying")),
              lte(events.scheduledFor, now),
              lte(events.attempts, events.maxAttempts),
              or(isNull(events.lockedUntil), lte(events.lockedUntil, now)),
              activeMachineIds.length === 0
                ? sql`true`
                : notInArray(
                    events.machineId,
                    activeMachineIds.map((m) => m.machineId),
                  ),
            ),
          )
          .returning();

        console.log("EVENTS TO BE PROCESSED", result);
        return result;
      });
    } catch (error) {
      console.error("Error in fetchAndLockEvents:", error);
      return [];
    }
  }

  getEventStream(): Observable<ActorEvent[]> {
    return this.eventSubject.asObservable();
  }
  async completeEvent(eventId: string, success: boolean): Promise<void> {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, eventId));

      if (!event) {
        console.log(
          `Event ${eventId} not found. It may have already been processed.`,
        );
        return;
      }

      if (success) {
        const processingDuration =
          now.getTime() - event.processingStartedAt!.getTime();

        await tx.insert(processedEvents).values({
          ...event,
          status: "complete",
          processedAt: now,
          processingDuration,
        });

        await tx.delete(events).where(eq(events.id, eventId));
      } else {
        if (event.attempts < event.maxAttempts) {
          const nextAttempt = event.attempts + 1;
          const backoffTime = Math.pow(2, nextAttempt - 1);
          const scheduledFor = add(now, { seconds: backoffTime });

          await tx
            .update(events)
            .set({
              status: "retrying",
              attempts: nextAttempt,
              scheduledFor,
              lockedUntil: null,
              processingStartedAt: null,
            })
            .where(eq(events.id, eventId));
        } else {
          const processingDuration =
            now.getTime() - event.processingStartedAt!.getTime();

          await tx.insert(processedEvents).values({
            ...event,
            status: "failed",
            processedAt: now,
            processingDuration,
          });

          await tx.delete(events).where(eq(events.id, eventId));
        }
      }
    });
  }

  private async cleanupStalledEvents(): Promise<void> {
    const now = new Date();

    await this.db.transaction(async (tx) => {
      const stalledEvents = await tx
        .select()
        .from(events)
        .where(
          and(eq(events.status, "processing"), lte(events.lockedUntil!, now)),
        );

      console.log("STALLED EVENTS", stalledEvents);
      for (const event of stalledEvents) {
        if (event.attempts >= event.maxAttempts) {
          await tx.insert(processedEvents).values({
            ...event,
            status: "failed",
            processedAt: now,
            processingDuration:
              now.getTime() - event.processingStartedAt!.getTime(),
          });
          await tx.delete(events).where(eq(events.id, event.id));
        } else {
          const nextAttempt = event.attempts + 1;
          const backoffTime = Math.pow(2, nextAttempt - 1);
          const scheduledFor = add(now, { seconds: backoffTime });

          await tx
            .update(events)
            .set({
              status: "retrying",
              attempts: nextAttempt,
              scheduledFor,
              lockedUntil: null,
              processingStartedAt: null,
            })
            .where(eq(events.id, event.id));
        }
      }
    });
  }

  async getEventsByMachineId(machineId: string) {
    const [activeEvents, completedEvents] = await Promise.all([
      this.db
        .select()
        .from(events)
        .where(eq(events.machineId, machineId))
        .orderBy(desc(events.createdAt)),
      this.db
        .select()
        .from(processedEvents)
        .where(eq(processedEvents.machineId, machineId))
        .orderBy(desc(processedEvents.processedAt)),
    ]);

    return {
      activeEvents,
      completedEvents,
    };
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
