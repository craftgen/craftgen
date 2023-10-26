/**
 * This file is also called in client side.
 */

import { ExtractPayload } from "rete-react-plugin/_types/presets/classic/types";
import { Schemes } from "./types";
import { P, match } from "ts-pattern";

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
import { CustomTextarea } from "./ui/control/custom-textarea";

import { ButtonControl } from "@seocraft/core/src/controls/button";
import { CodeControl } from "@seocraft/core/src/controls/code";
import { ArticleControl } from "@seocraft/core/src/controls/article";
import { SelectControl } from "@seocraft/core/src/controls/select";
import { SWRSelectControl } from "@seocraft/core/src/controls/swr-select";
import { SocketGeneratorControl } from "@seocraft/core/src/controls/socket-generator";
import { NumberControl } from "@seocraft/core/src/controls/number";
import { SliderControl } from "@seocraft/core/src/controls/slider";
import { GoogleDriveControl } from "@seocraft/core/src/controls/google-drive";
import { TableControl } from "@seocraft/core/src/controls/table";
import { InputControl } from "@seocraft/core/src/controls/input.control";
import { TextareControl } from "@seocraft/core/src/controls/textarea";

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
