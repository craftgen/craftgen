import { ClassicPreset, NodeEditor } from "rete";
import { Schemes } from "./types";
import { ControlFlowEngine, DataflowEngine } from "rete-engine";
import { Input, Output } from "./nodes";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";

export type Module = {
  apply: (editor: NodeEditor<Schemes>) => Promise<void>;
  exec: (data: Record<string, any>) => Promise<any>;
};

export class Modules {
  constructor(
    private has: (path: string) => boolean,
    private graph: (params: {
      moduleId: string;
      overwrites: {
        editor: NodeEditor<Schemes>;
        engine?: ControlFlowEngine<Schemes>;
        dataFlow?: DataflowEngine<Schemes>;
      };
    }) => Promise<void>
  ) {}

  public findModule = (path: string): null | Module => {
    console.log("findModule", path, this.has(path));
    if (!this.has(path)) return null;

    return {
      apply: (editor: NodeEditor<Schemes>) =>
        this.graph({ moduleId: path, overwrites: { editor } }),
      exec: async (inputData: Record<string, any>) => {
        const editor = new NodeEditor<Schemes>();
        editor.name = `Module: ${path}`;
        const dataFlow = createDataFlowEngine();
        const engine = createControlFlowEngine();

        editor.use(engine);
        editor.use(dataFlow);
        await this.graph({
          moduleId: path,
          overwrites: { editor, dataFlow, engine },
        });

        const val = await this.execute({
          inputs: inputData,
          editor,
          dataFlow,
          engine,
        });
        return val;
      },
    };
  };

  private injectInputs(
    nodes: Schemes["Node"][],
    inputData: Record<string, any>
  ) {
    const inputNodes = nodes.filter(Modules.isInputNode) as Input[];
    console.log("inject", inputNodes);

    inputNodes.forEach((node) => {
      const key = (node.controls["name"] as ClassicPreset.InputControl<"text">)
        .value;
      if (key) {
        node.actor.send({
          type: "SET_VALUE",
          value: inputData[key] && inputData[key][0],
        });
      }
    });
  }

  private static isInputNode<S extends Schemes>(
    node: S["Node"]
  ): node is S["Node"] & { inputValue: any } {
    return node instanceof Input;
  }

  private static isOutputNode<S extends Schemes>(
    node: S["Node"]
  ): node is S["Node"] & { outputValue: any } {
    return node instanceof Output;
  }

  private async retrieveOutputs(
    nodes: Schemes["Node"][],
    dataFlow: DataflowEngine<Schemes>
  ) {
    const outputNodes = nodes.filter(Modules.isOutputNode) as Output[];
    const outputs = await Promise.all(
      outputNodes.map(async (outNode) => {
        const data = await dataFlow.fetch(outNode.id);

        const key = (
          outNode.controls["name"] as ClassicPreset.InputControl<"text">
        ).value;

        if (!key) throw new Error("cannot get output node name");

        return [key, data.value] as const;
      })
    );

    return Object.fromEntries(outputs);
  }

  private async execute({
    inputs,
    editor,
    engine,
    dataFlow,
  }: {
    inputs: Record<string, any>;
    editor: NodeEditor<Schemes>;
    engine: ControlFlowEngine<Schemes>;
    dataFlow: DataflowEngine<Schemes>;
  }) {
    const nodes = editor.getNodes();

    this.injectInputs(nodes, inputs);
    const inputNodes = nodes.filter(Modules.isInputNode);

    /**
     * Send trigger to all input nodes
     */
    await Promise.all(inputNodes.map((node) => engine.execute(node.id)));

    console.log("@@@@ Calling for outputs");
    return this.retrieveOutputs(nodes, dataFlow);
  }

  public static getPorts(editor: NodeEditor<Schemes>) {
    const nodes = editor.getNodes();
    console.log("getPorts", nodes);
    const inputNodes = nodes.filter(Modules.isInputNode) as Input[];
    const inputs = inputNodes.map(
      (n) =>
        (n.controls.name as ClassicPreset.InputControl<"text">).value as string
    );
    const outputNodes = nodes.filter(Modules.isOutputNode) as Output[];
    const outputs = outputNodes.map(
      (n) =>
        (n.controls.name as ClassicPreset.InputControl<"text">).value as string
    );
    return {
      inputs,
      outputs,
    };
  }
}
