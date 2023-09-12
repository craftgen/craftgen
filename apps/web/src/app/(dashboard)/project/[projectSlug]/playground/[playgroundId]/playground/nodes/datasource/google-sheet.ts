import { createMachine } from "xstate";
import { BaseNode, NodeData } from "../base";
import { DiContainer } from "../../editor";

const GoogleSheetMachine = createMachine({
  id: "google-sheet",
});

export class GoogleSheet extends BaseNode<typeof GoogleSheetMachine> {
  constructor(di: DiContainer, data: NodeData<typeof GoogleSheetMachine>) {
    super("GoogleSheet", "Google Sheet", di, data, GoogleSheetMachine, {});
  }

  execute(_: any, forward: (output: "trigger") => void) {
    forward("trigger");
  }

  data() {
    return {};
  }

  async serialize() {
    return {};
  }
}
