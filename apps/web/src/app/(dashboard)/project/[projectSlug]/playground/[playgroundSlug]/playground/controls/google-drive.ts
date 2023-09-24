import {
  CallbackDoc,
  PickerConfiguration,
} from "react-google-drive-picker/dist/typeDefs";
import { ClassicPreset } from "rete";

export type GoogleDriveControlSettings = {
  multiselect?: boolean;
  viewId?: PickerConfiguration["viewId"];
  onSelect: (file: CallbackDoc | undefined) => void;
};

export class GoogleDriveControl extends ClassicPreset.Control {
  __type = "google-drive";

  constructor(
    public value: CallbackDoc | undefined,
    public readonly settings: GoogleDriveControlSettings
  ) {
    super();
  }

  setValue(value: CallbackDoc | undefined) {
    this.value = value;
    this.settings.onSelect(value);
  }
}
