import { WorkerMessenger } from "../messenger";

// @ts-ignore
// import Worker from "worker-loader!./entry.worker";

export function start() {
  // let worker = new Worker();
  let worker = new Worker(new URL("./entry.worker.ts", import.meta.url));
  return new WorkerMessenger(worker);
}
