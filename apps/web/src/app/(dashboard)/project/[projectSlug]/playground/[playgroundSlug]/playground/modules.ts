import { ClassicPreset, NodeEditor } from "rete";
import { ConnProps, NodeProps, Schemes } from "./types";
import { DataflowEngine } from "rete-engine";
import { Input, Output } from "./nodes";
import { createControlFlowEngine, createDataFlowEngine } from "./engine/engine";
import { structures } from "rete-structures";
import { Structures } from "rete-structures/_types/types";
import { ControlFlowEngine } from "./engine/control-flow-engine";

export type Module = {
  editor: NodeEditor<Schemes>;
  engine: ControlFlowEngine<Schemes>;
  dataFlow: DataflowEngine<Schemes>;
  graph: Structures<NodeProps, ConnProps>;
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
        graph?: Structures<NodeProps, ConnProps>;
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
    const graph = structures(editor);
    await this.graph({
      moduleId: path,
      overwrites: { editor, dataFlow, engine, graph },
    });

    return {
      editor,
      graph,
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

  public static getPorts({
    editor,
    inputId,
    graph,
  }: {
    editor: NodeEditor<Schemes>;
    inputId: string;
    graph: Structures<NodeProps, ConnProps>;
  }) {
    const nodes = editor.getNodes();
    const selectedInput = editor.getNode(inputId);
    const outputNodes = graph
      .successors(selectedInput.id)
      .filter((n) => {
        return Modules.isOutputNode(n);
      })
      .nodes();
    console.log("outputNodes", outputNodes);
    const inputState = selectedInput.actor.getSnapshot();
    let outputs = [];
    if (outputNodes.length > 0) {
      const output = outputNodes[0];
      const outputState = output.actor.getSnapshot();
      outputs = outputState.context.inputs;
    }
    return {
      inputs: inputState.context.outputs,
      outputs,
    };
  }
}
