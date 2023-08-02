import { ClassicPreset } from "rete";
import { DiContainer } from "../editor";
import { SelectControl } from "../ui/control/control-select";
import { TextSocket } from "../sockets";

type Data = {
  name: string;
};

export class DataSource extends ClassicPreset.Node<
  {},
  {
    foreach: TextSocket;
  },
  {
    datasourceId: SelectControl<string>;
  }
> {
  height = 320;
  width = 280;
  
  private di: DiContainer;

  constructor(di: DiContainer, data: Data) {
    super("DataSource");
    this.di = di;

    this.addOutput(
      "foreach",
      new ClassicPreset.Output(new TextSocket(), "foreach")
    );

    this.addControl(
      "datasourceId",
      new SelectControl<string>("Famous", "DataSource", [
        {
          key: "Famous",
          value: "Famous",
        },
        {
          key: "Chess Games",
          value: "Chess Games",
        },
      ])
    );
  }

  execute() {
    return {};
  }

  data() {
    return {};
  }

  serialize() {
    return {};
  }
}
