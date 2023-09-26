import { StateFrom, assign, createMachine } from "xstate";
import { BaseNode, NodeData } from "../../base";
import { DiContainer } from "../../../editor";
import { ClassicPreset } from "rete";
import { objectSocket, triggerSocket } from "../../../sockets";
import { SelectControl } from "../../../controls/select";

const WordpressMachine = createMachine({
  id: "wordpress",
  context: {
    settings: {
      wordpressId: "",
      postId: "332471859",
      action: "addPost",
    },
  },
  initial: "idle",
  types: {} as {
    context: {
      settings: {
        wordpressId: string;
        postId: string;
        action: "addPost" | "readPost";
      };
    };
    events: {
      type: "CONFIG_CHANGE";
      settings: {
        wordpressId: string;
        postId: string;
        action: "addPost" | "readPost";
      };
    };
  },
  states: {
    idle: {
      on: {
        CONFIG_CHANGE: {
          target: "idle",
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              ...event.settings,
            }),
          }),
        },
      },
    },
    running: {},
  },
});

export class Wordpress extends BaseNode<typeof WordpressMachine> {
  public action: "addPost" | "readPost" = "addPost";
  constructor(di: DiContainer, data: NodeData<typeof WordpressMachine>) {
    super("Wordpress",  di, data, WordpressMachine, {
      actions: {
        updateConfig: ({ event }) => {
          console.log("updateConfig", event);
          assign({
            settings: {
              wordpressId: event.settings.wordpressId,
            },
          });
        },
      },
    });
    const state = this.actor.getSnapshot();
    this.action = state.context.settings.action;
    this.addInput("trigger", new ClassicPreset.Input(triggerSocket, "trigger"));
    this.addOutput(
      "trigger",
      new ClassicPreset.Output(triggerSocket, "trigger")
    );

    this.addControl(
      "action",
      new SelectControl("addPost", {
        placeholder: "Select an action",
        values: [
          {
            key: "addPost",
            value: "Add Post",
          },
          {
            key: "readPost",
            value: "Read Post",
          },
        ],
        change: (v) => {
          console.log("change", v);
          this.actor.send({
            type: "CONFIG_CHANGE",
            settings: {
              action: v,
            },
          });
        },
      })
    );

    // this.addControl('wordpressID', )
    this.addControl(
      "wordpressID",
      new ClassicPreset.InputControl("text", {
        initial: state.context.settings.wordpressId,
        change: (v) => {
          this.actor.send({
            type: "CONFIG_CHANGE",
            settings: {
              wordpressId: v,
            },
          });
        },
      })
    );

    this.actor.subscribe((state) => {
      this.action = state.context.settings.action;
      this.syncUI(state);
    });
    this.syncUI(state);
  }

  async syncUI(state: StateFrom<typeof WordpressMachine>) {
    if (state.context.settings.action === "addPost") {
      if (!this.inputs["add_post"]) {
        this.addInput(
          "add_post",
          new ClassicPreset.Input(objectSocket, "post")
        );
      }
    } else {
      if (this.inputs["add_post"]) {
        this.removeInput("add_post");
      }
    }
    if (state.context.settings.action === "readPost") {
      if (!this.outputs["read_post"]) {
        this.addOutput(
          "read_post",
          new ClassicPreset.Output(objectSocket, "post")
        );
      }
    } else {
      if (this.outputs["read_post"]) {
        this.removeOutput("read_post");
      }
    }

    console.log("syncUI", state);
  }

  execute(_: any, forward: (output: "trigger") => void) {
    forward("trigger");
  }

  async data() {
    return {};
  }

  async serialize() {
    return {};
  }
}
