import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  // handleReturnedServerError(e) {
  //   throw e;
  // },
  // serverErrorLogFunction(e) {
  //   console.error(e);
  // },
});
