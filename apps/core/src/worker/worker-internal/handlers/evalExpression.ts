import { EvalWorkerRequest } from "../../types";
import { evaluateAsync } from "../evaluate";

export default function (request: EvalWorkerRequest) {
  const { data } = request;
  const { expression, evalArguments } = data;
  return evaluateAsync(expression, evalArguments || []);
}
