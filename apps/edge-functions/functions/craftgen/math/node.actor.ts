import { setup } from "npm:xstate";

export default setup({}).createMachine({
  initial: "idle",
  states: {
    idle: {},
  },
});
