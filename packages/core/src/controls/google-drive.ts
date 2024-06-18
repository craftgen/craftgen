import type {
  CallbackDoc,
  PickerConfiguration,
} from "react-google-drive-picker/dist/typeDefs";

import { BaseControl } from "./base";

export interface GoogleDriveControlSettings {
  multiselect?: boolean;
  viewId?: PickerConfiguration["viewId"];
  onSelect: (file: CallbackDoc | undefined) => void;
}

export class GoogleDriveControl extends BaseControl {
  __type = "google-drive";

  constructor(
    public value: CallbackDoc | undefined,
    public readonly settings: GoogleDriveControlSettings,
  ) {
    super(150);
  }

  setValue(value: CallbackDoc | undefined) {
    this.value = value;
    this.settings.onSelect(value);
  }
}
