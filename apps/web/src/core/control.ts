/**
 * This file is also called in client side.
 */

import { match, P } from "ts-pattern";

import { BooleanControl } from "@seocraft/core/src/controls/boolean";
import { ButtonControl } from "@seocraft/core/src/controls/button";
import { CodeControl } from "@seocraft/core/src/controls/code";
import { ComboboxControl } from "@seocraft/core/src/controls/combobox";
import { DateControl } from "@seocraft/core/src/controls/date";
import { FileControl } from "@seocraft/core/src/controls/file";
import { GoogleDriveControl } from "@seocraft/core/src/controls/google-drive";
import { InputControl } from "@seocraft/core/src/controls/input.control";
import { JsonControl } from "@seocraft/core/src/controls/json";
import { NumberControl } from "@seocraft/core/src/controls/number";
import { OpenAIChatSettingsControl } from "@seocraft/core/src/controls/openai-chat-settings";
import { OpenAIApiConfigurationControl } from "@seocraft/core/src/controls/openai-configuration";
import { OpenAIThreadControl } from "@seocraft/core/src/controls/openai-thread.control";
import { SelectControl } from "@seocraft/core/src/controls/select";
import { SliderControl } from "@seocraft/core/src/controls/slider";
import { SocketGeneratorControl } from "@seocraft/core/src/controls/socket-generator";
import { SWRSelectControl } from "@seocraft/core/src/controls/swr-select";
import { TableControl } from "@seocraft/core/src/controls/table";
import { TextareControl } from "@seocraft/core/src/controls/textarea";
import { ThreadControl } from "@seocraft/core/src/controls/thread.control";
import type { ExtractPayload } from "@seocraft/core/src/plugins/reactPlugin/presets/classic/types";
import type { Schemes } from "@seocraft/core/src/types";

import { BooleanControlComponent } from "./ui/control/control-boolean";
// Control Components
import { CustomButton } from "./ui/control/control-button";
import { CodeEditor } from "./ui/control/control-code";
import { DateControlComponent } from "./ui/control/control-date";
import { FileControlComponent } from "./ui/control/control-file";
import { GoogleDriveControlComponent } from "./ui/control/control-google-drive";
import { JsonControlComponent } from "./ui/control/control-json";
import { NumberControlComponent } from "./ui/control/control-number";
import { OpenAIChatSettingsControlComponent } from "./ui/control/control-openai-chat-settings";
import { OpenAIConfigutationControlComponent } from "./ui/control/control-openai-configuration";
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
    .with(P.instanceOf(ComboboxControl), () => SWRSelectControlComponent)
    .with(P.instanceOf(OpenAIThreadControl), () => OpenAIThreadControlComponent)
    .with(
      P.instanceOf(OpenAIApiConfigurationControl),
      () => OpenAIConfigutationControlComponent,
    )
    .with(
      P.instanceOf(OpenAIChatSettingsControl),
      () => OpenAIChatSettingsControlComponent,
    )
    .with(P.instanceOf(DateControl), () => DateControlComponent)
    .with(P.instanceOf(ThreadControl), () => ThreadControlComponent)
    .with(P.instanceOf(JsonControl), () => JsonControlComponent)
    .otherwise(() => () => null);
};
