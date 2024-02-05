import { WorkerMessenger } from "../messenger";

// @ts-ignore
import Worker from "worker-loader!./entry.worker";

export function start() {
  let worker = new Worker();
  return new WorkerMessenger(worker);
}
