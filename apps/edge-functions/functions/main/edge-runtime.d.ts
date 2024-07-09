declare global {
  interface EdgeRuntime {
    userWorkers: SUPABASE_USER_WORKERS;
    getRuntimeMetrics: () => Promise<RuntimeMetrics>;
    applySupabaseTag: (src: unknown, dest: unknown) => void;
    systemMemoryInfo: () => unknown;
  }

  const EdgeRuntime: EdgeRuntime;
}

interface RuntimeMetrics {
  mainWorkerHeapStats: HeapStats;
  eventWorkerHeapStats: HeapStats;
  activeUserWorkersCount: number;
  retiredUserWorkersCount: number;
  receivedRequestsCount: number;
  handledRequestsCount: number;
}

interface HeapStats {
  totalHeapSize: number;
  totalHeapSizeExecutable: number;
  totalPhysicalSize: number;
  totalAvailableSize: number;
  totalGlobalHandlesSize: number;
  usedGlobalHandlesSize: number;
  usedHeapSize: number;
  mallocedMemory: number;
  externalMemory: number;
  peakMallocedMemory: number;
}

// Since SUPABASE_USER_WORKERS is not fully defined in the provided files,
// we'll create a basic interface for it based on the available information
interface SUPABASE_USER_WORKERS {
  create(opts: UserWorkerOptions): Promise<UserWorker>;
}

interface UserWorkerOptions {
  memoryLimitMb?: number;
  lowMemoryMultiplier?: number;
  workerTimeoutMs?: number;
  cpuTimeSoftLimitMs?: number;
  cpuTimeHardLimitMs?: number;
  noModuleCache?: boolean;
  importMapPath?: string | null;
  envVars?: string[][];
  forceCreate?: boolean;
  netAccessDisabled?: boolean;
  allowRemoteModules?: boolean;
  customModuleRoot?: string;
  maybeEszip?: unknown;
  maybeEntrypoint?: unknown;
  maybeModuleCode?: unknown;
  servicePath?: string;
}

interface UserWorker {
  fetch(
    request: Request,
    options?: { signal?: AbortSignal },
  ): Promise<Response>;
}

export {};
