import { ClassicPreset, NodeEditor } from "rete";
import { NodeProps, Schemes } from "./types";
import { ControlFlowEngine, DataflowEngine } from "rete-engine";
import { Input, Output } from "./nodes";
import { createControlFlowEngine, createDataFlowEngine } from "./engine";

export type Module = {
  editor: NodeEditor<Schemes>;
  engine: ControlFlowEngine<Schemes>;
  dataFlow: DataflowEngine<Schemes>;
  apply: (editor: NodeEditor<Schemes>) => Promise<void>;
  exec: (inputId: string, data: Record<string, any>) => Promise<any>;
};

export class Modules {
  constructor(
    private graph: (params: {
      moduleId: string;
      overwrites: {
        editor: NodeEditor<Schemes>;
        engine?: ControlFlowEngine<Schemes>;
        dataFlow?: DataflowEngine<Schemes>;
      };
    }) => Promise<void>
  ) {}

  public findModule = async (path: string): Promise<null | Module> => {
    const editor = new NodeEditor<Schemes>();
    editor.name = `module_${path}`;
    const dataFlow = createDataFlowEngine();
    const engine = createControlFlowEngine();

    editor.use(engine);
    editor.use(dataFlow);
    await this.graph({
      moduleId: path,
      overwrites: { editor, dataFlow, engine },
    });

    return {
      editor,
      dataFlow,
      engine,
      apply: (editor: NodeEditor<Schemes>) =>
        this.graph({ moduleId: path, overwrites: { editor } }),
      exec: async (inputId: string, inputData: Record<string, any>) => {
        
        const val = await this.execute({
          inputId,
          inputs: inputData,
          editor,
          dataFlow,
          engine,
        });
        return val;
      },
    };
  };

  private injectInputs(node: NodeProps, inputData: Record<string, any>) {
    console.log("inject Data TO INPUT OF MODULE", node, inputData);
    node.actor.send({
      type: "SET_VALUE",
      values: inputData,
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
    inputId,
    inputs,
    editor,
    engine,
    dataFlow,
  }: {
    inputId: string;
    inputs: Record<string, any>;
    editor: NodeEditor<Schemes>;
    engine: ControlFlowEngine<Schemes>;
    dataFlow: DataflowEngine<Schemes>;
  }) {
    console.log("EXECUTING IN MODULES", {
      inputId,
      inputs,
      editor,
      engine,
      dataFlow,
    });
    const nodes = editor.getNodes();
    const inputNode = editor.getNode(inputId);

    this.injectInputs(inputNode, inputs);
    engine.execute(inputId);

    console.log("@@@@ Calling for outputs");
    return this.retrieveOutputs(nodes, dataFlow);
  }

  public static getPorts(editor: NodeEditor<Schemes>, inputId: string) {
    const nodes = editor.getNodes();
    const selectedInput = editor.getNode(inputId);
    const state = selectedInput.actor.getSnapshot();
    const outputNodes = nodes.filter(Modules.isOutputNode) as Output[];
    const outputs = outputNodes.map(
      (n) =>
        (n.controls.name as ClassicPreset.InputControl<"text">).value as string
    );
    return {
      inputs: state.context.outputs,
      outputs,
    };
  }
}
