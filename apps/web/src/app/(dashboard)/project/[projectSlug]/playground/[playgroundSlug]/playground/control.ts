import { ExtractPayload } from "rete-react-plugin/_types/presets/classic/types";
import { Schemes } from "./types";
import { P, match } from "ts-pattern";

// Control Classes
import { CodeControl } from "./controls/code";
import { ButtonControl } from "./controls/button";
import { ArticleControl } from "./controls/article";
import { GoogleDriveControl } from "./controls/google-drive";
import { NumberControl } from "./controls/number";
import { SelectControl } from "./controls/select";
import { SliderControl } from "./controls/slider";
import { SocketGeneratorControl } from "./controls/socket-generator";
import { SWRSelectControl } from "./controls/swr-select";
import { TableControl } from "./controls/table";

// Control Components
import { CustomButton } from "./ui/control/control-button";
import { CodeEditor } from "./ui/control/control-code";
import { SelectControlComponent } from "./ui/control/control-select";
import { TableControlComponent } from "./ui/control/control-table";
import { CustomInput } from "./ui/control/custom-input";
import { SocketGeneratorControlComponent } from "./ui/control/control-socket-generator";
import { ArticleEditor } from "./ui/control/control-editor";
import { SWRSelectControlComponent } from "./ui/control/control-swr-select";
import { SliderControlComponenet as SliderControlComponent } from "./ui/control/control-slider";
import { GoogleDriveControlComponent } from "./ui/control/control-google-drive";
import { NumberControlComponent } from "./ui/control/control-number";
import { TextareControl } from "./controls/textarea";
import { CustomTextarea } from "./ui/control/custom-textarea";
import { InputControl } from "./controls/input.control";
import { SocketType } from "./sockets";

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
    .with(
      P.instanceOf(SocketGeneratorControl),
      () => SocketGeneratorControlComponent
    )
    .with(P.instanceOf(InputControl), () => CustomInput)
    .with(P.instanceOf(TextareControl), () => CustomTextarea)
    .with(P.instanceOf(NumberControl), () => NumberControlComponent)
    .with(P.instanceOf(SliderControl), () => SliderControlComponent)
    .with(P.instanceOf(GoogleDriveControl), () => GoogleDriveControlComponent)
    .otherwise(() => () => null);
};

export const getControlBySocket = (socket: SocketType) => {
  return match(socket)
    .with("stringSocket", () => CustomInput)
    .with("numberSocket", () => NumberControl)
    .run();
};
