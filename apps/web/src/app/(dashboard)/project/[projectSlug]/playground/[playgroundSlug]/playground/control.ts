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
import {
  SliderControl,
  SliderControlComponenet as SliderControlComponent,
} from "./ui/control/control-slider";
import {
  GoogleDriveControl,
  GoogleDriveControlComponent,
} from "./ui/control/control-google-drive";
import { NumberControl, NumberControlComponent } from "./ui/control/control-number";
import { P, match } from "ts-pattern";

export const getControl = (
  data: ExtractPayload<Schemes, "control">
): (({ data }: { data: any }) => JSX.Element | null) => {
  return match(data.payload)
    .with(P.instanceOf(ButtonControl), () => CustomButton)
    .with(P.instanceOf(CodeControl), () => CodeEditor)
    .with(P.instanceOf(ArticleControl), () => ArticleEditor)
    .with(P.instanceOf(SelectControl), () => SelectControlComponent)
    .with(P.instanceOf(SWRSelectControl), () => SWRSelectControlComponent)
    .with(P.instanceOf(TableControl), () => TableControlComponent)
    .with(P.instanceOf(DataSourceControl), () => DataSourceControlComponent)
    .with(P.instanceOf(DebugControl), () => DebugControlComponent)
    .with(P.instanceOf(SocketGeneratorControl), () => SocketGeneratorControlComponent)
    .with(P.instanceOf(ClassicPreset.InputControl), () => CustomInput)
    .with(P.instanceOf(NumberControl), () => NumberControlComponent)
    .with(P.instanceOf(SliderControl), () => SliderControlComponent)
    .with(P.instanceOf(GoogleDriveControl), () => GoogleDriveControlComponent)
    .otherwise(() => () => null)
};
