// TODO:
// @ts-nocheck

import type { SetOptional } from "type-fest";
import { assign, createMachine } from "xstate";

import type { DiContainer } from "../../../types";
import { BaseNode, type ParsedNode } from "../../base";

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

export type WordpressData = ParsedNode<"Wordpress", typeof WordpressMachine>;

export class Wordpress extends BaseNode<typeof WordpressMachine> {
  static nodeType = "Wordpress" as const;
  static label = "Wordpress";
  static description = "Node for handling wordpress";
  static icon = "wordpress";

  static parse(params: SetOptional<WordpressData, "type">): WordpressData {
    return {
      ...params,
      type: "Wordpress",
    };
  }

  public action: "addPost" | "readPost" = "addPost";
  constructor(di: DiContainer, data: WordpressData) {
    super("Wordpress", di, data, WordpressMachine, {
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

    //   this.addControl(
    //     "action",
    //     new SelectControl("addPost", {
    //       placeholder: "Select an action",
    //       values: [
    //         {
    //           key: "addPost",
    //           value: "Add Post",
    //         },
    //         {
    //           key: "readPost",
    //           value: "Read Post",
    //         },
    //       ],
    //       change: (v) => {
    //         console.log("change", v);
    //         this.actor.send({
    //           type: "CONFIG_CHANGE",
    //           settings: {
    //             action: v,
    //           },
    //         });
    //       },
    //     }),
    //   );

    //   // this.addControl('wordpressID', )
    //   this.addControl(
    //     "wordpressID",
    //     new InputControl(() => this.snap.context.settings.wordpressId, {
    //       change: (v) => {
    //         this.actor.send({
    //           type: "CONFIG_CHANGE",
    //           settings: {
    //             wordpressId: v,
    //           },
    //         });
    //       },
    //     }),
    //   );

    //   this.actor.subscribe((state) => {
    //     this.action = state.context.settings.action;
    //     this.syncUI(state);
    //   });
    //   this.syncUI(state);
  }

  // async syncUI(state: StateFrom<typeof WordpressMachine>) {
  //   if (state.context.settings.action === "addPost") {
  //     if (!this.inputs.add_post) {
  //       this.addInput("add_post", new Input(objectSocket, "post"));
  //     }
  //   } else {
  //     if (this.inputs.add_post) {
  //       this.removeInput("add_post");
  //     }
  //   }
  //   if (state.context.settings.action === "readPost") {
  //     if (!this.outputs.read_post) {
  //       this.addOutput("read_post", new Output(objectSocket, "post"));
  //     }
  //   } else {
  //     if (this.outputs.read_post) {
  //       this.removeOutput("read_post");
  //     }
  //   }

  //   console.log("syncUI", state);
  // }
}
