import { WorkerMessenger } from "../messenger";
import Worker from "worker-loader!./entry";

export function start() {
  let worker = new Worker();
  return new WorkerMessenger(worker);
}
