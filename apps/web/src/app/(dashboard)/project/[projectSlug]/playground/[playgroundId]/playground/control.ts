import { ExtractPayload } from "rete-react-plugin/_types/presets/classic/types";
import { Schemes } from "./types";
import { ClassicPreset } from "rete";
import { ButtonControl, CustomButton } from "./ui/control/control-button";
import { CodeControl, CodeEditor } from "./ui/control/control-code";
import {
  DebugControl,
  DebugControlComponent,
} from "./ui/control/control-debug";
import {
  SelectControl,
  SelectControlComponent,
} from "./ui/control/control-select";
import {
  TableControl,
  TableControlComponent,
} from "./ui/control/control-table";
import { CustomInput } from "./ui/control/custom-input";
import {
  DataSourceControl,
  DataSourceControlComponent,
} from "./ui/control/control-datasource";
import {
  SocketGeneratorControl,
  SocketGeneratorControlComponent,
} from "./ui/control/control-socket-generator";
import { ArticleEditor, ArticleControl } from "./ui/control/control-editor";
import {
  SWRSelectControl,
  SWRSelectControlComponent,
} from "./ui/control/control-swr-select";

export const getControl = (
  data: ExtractPayload<Schemes, "control">
): (({ data }: { data: any }) => JSX.Element | null) => {
  if (data.payload instanceof ButtonControl) {
    return CustomButton;
  }
  if (data.payload instanceof CodeControl) {
    return CodeEditor;
  }
  if (data.payload instanceof ArticleControl) {
    return ArticleEditor;
  }
  if (data.payload instanceof SelectControl) {
    return SelectControlComponent;
  }
  if (data.payload instanceof SWRSelectControl) {
    return SWRSelectControlComponent;
  }
  if (data.payload instanceof TableControl) {
    return TableControlComponent;
  }
  if (data.payload instanceof DataSourceControl) {
    return DataSourceControlComponent;
  }
  if (data.payload instanceof DebugControl) {
    return DebugControlComponent;
  }
  if (data.payload instanceof SocketGeneratorControl) {
    return SocketGeneratorControlComponent;
  }
  if (data.payload instanceof ClassicPreset.InputControl) {
    return CustomInput;
  }
  return ({ data }) => null;
  // return ClassicPreset.Control;
};
