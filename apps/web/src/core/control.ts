/**
 * This file is also called in client side.
 */

import { match, P } from "ts-pattern";

import { BooleanControl } from "@craftgen/core/src/controls/boolean";
import { ButtonControl } from "@craftgen/core/src/controls/button";
import { CodeControl } from "@craftgen/core/src/controls/code";
import { ComboboxControl } from "@craftgen/core/src/controls/combobox";
import { DateControl } from "@craftgen/core/src/controls/date";
import { FileControl } from "@craftgen/core/src/controls/file";
import { GoogleDriveControl } from "@craftgen/core/src/controls/google-drive";
import { InputControl } from "@craftgen/core/src/controls/input.control";
import { JsCdnController } from "@craftgen/core/src/controls/js-cdn";
import { JsonControl } from "@craftgen/core/src/controls/json";
import { NodeControl } from "@craftgen/core/src/controls/node";
import { NumberControl } from "@craftgen/core/src/controls/number";
import { OpenAIThreadControl } from "@craftgen/core/src/controls/openai-thread.control";
import { SecretController } from "@craftgen/core/src/controls/secret";
import { SelectControl } from "@craftgen/core/src/controls/select";
import { SliderControl } from "@craftgen/core/src/controls/slider";
import { SocketGeneratorControl } from "@craftgen/core/src/controls/socket-generator";
import { SWRSelectControl } from "@craftgen/core/src/controls/swr-select";
import { TableControl } from "@craftgen/core/src/controls/table";
import { TextareControl } from "@craftgen/core/src/controls/textarea";
import { ThreadControl } from "@craftgen/core/src/controls/thread.control";
import type { ExtractPayload } from "@craftgen/core/src/plugins/reactPlugin/presets/classic/types";
import type { Schemes } from "@craftgen/core/src/types";

import { BooleanControlComponent } from "./ui/control/control-boolean";
// Control Components
import { CustomButton } from "./ui/control/control-button";
import { CodeEditor } from "./ui/control/control-code";
import { ComboboxControlComponent } from "./ui/control/control-combobox";
import { DateControlComponent } from "./ui/control/control-date";
import { FileControlComponent } from "./ui/control/control-file";
import { GoogleDriveControlComponent } from "./ui/control/control-google-drive";
import { JsCdnControlComponent } from "./ui/control/control-js-cdn";
import { JsonControlComponent } from "./ui/control/control-json";
import { NodeControlComponent } from "./ui/control/control-node";
import { NumberControlComponent } from "./ui/control/control-number";
import { SecretControlComponent } from "./ui/control/control-secret";
import { SelectControlComponent } from "./ui/control/control-select";
import { SliderControlComponenet as SliderControlComponent } from "./ui/control/control-slider";
import { SocketGeneratorControlComponent } from "./ui/control/control-socket-generator";
import { SWRSelectControlComponent } from "./ui/control/control-swr-select";
import { TableControlComponent } from "./ui/control/control-table";
import { CustomInput } from "./ui/control/custom-input";
import { CustomTextarea } from "./ui/control/custom-textarea";
import { OpenAIThreadControlComponent } from "./ui/control/thread/control-openai-thread";
import { ThreadControlComponent } from "./ui/control/thread/control-thread";

export const getControl = (
  data: ExtractPayload<Schemes, "control">,
): (({ data }: { data: any }) => JSX.Element | null) => {
  return match(data.payload)
    .with(P.instanceOf(NodeControl), () => NodeControlComponent)
    .with(P.instanceOf(ButtonControl), () => CustomButton)
    .with(P.instanceOf(CodeControl), () => CodeEditor)
    .with(P.instanceOf(SelectControl), () => SelectControlComponent)
    .with(P.instanceOf(SWRSelectControl), () => SWRSelectControlComponent)
    .with(P.instanceOf(TableControl), () => TableControlComponent)
    .with(
      P.instanceOf(SocketGeneratorControl),
      () => SocketGeneratorControlComponent,
    )
    .with(P.instanceOf(InputControl), () => CustomInput)
    .with(P.instanceOf(TextareControl), () => CustomTextarea)
    .with(P.instanceOf(NumberControl), () => NumberControlComponent)
    .with(P.instanceOf(BooleanControl), () => BooleanControlComponent)
    .with(P.instanceOf(FileControl), () => FileControlComponent)
    .with(P.instanceOf(SliderControl), () => SliderControlComponent)
    .with(P.instanceOf(GoogleDriveControl), () => GoogleDriveControlComponent)
    .with(P.instanceOf(ComboboxControl), () => ComboboxControlComponent)
    .with(P.instanceOf(JsCdnController), () => JsCdnControlComponent)
    .with(P.instanceOf(SecretController), () => SecretControlComponent)
    .with(P.instanceOf(OpenAIThreadControl), () => OpenAIThreadControlComponent)
    .with(P.instanceOf(DateControl), () => DateControlComponent)
    .with(P.instanceOf(ThreadControl), () => ThreadControlComponent)
    .with(P.instanceOf(JsonControl), () => JsonControlComponent)
    .otherwise(() => () => null);
};
