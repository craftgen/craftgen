import { useEffect, useState } from "react";
import { ExternalLink, XIcon } from "lucide-react";
import useDrivePicker from "react-google-drive-picker";
import type { CallbackDoc } from "react-google-drive-picker/dist/typeDefs";

import type { GoogleDriveControl } from "@craftgen/core/controls/google-drive";
import { Button } from "@craftgen/ui/components/button";
import { api } from "@craftgen/ui/lib/api";

export function GoogleDriveControlComponent(props: {
  data: GoogleDriveControl;
}) {
  const [file, setFile] = useState<CallbackDoc | undefined>(props.data.value);

  useEffect(() => {
    setFile(props.data.value);
  }, [props.data.value]);

  const [openPicker, authResponse] = useDrivePicker();
  // const { data } = useSWR("user", getUser);
  const { data: user } = api.auth.getSession.useQuery();
  const handleOpenPicker = () => {
    throw new Error("Not implemented");
    openPicker({
      clientId:
        "619535389805-mfft6289t4uhhdgdf0s4f062m1dgnqvc.apps.googleusercontent.com",
      appId: "619535389805",
      viewId: props.data.settings.viewId || "DOCS",
      developerKey: "AIzaSyDinRsOhUnql1Ax4yUtsOMmG12zmZL2QoE",
      // ...(data?.google_access_token && { token: user?.google_access_token }),
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: props.data.settings.multiselect || false,
      // customViews: customViewsArray, // custom view
      callbackFunction: (data) => {
        if (data.action === "cancel") {
          console.log("User clicked cancel/close button");
        }
        if (data.action === "picked") {
          setFile(data.docs[0]);
          props.data.settings.onSelect(data.docs[0]);
        }
        console.log(data);
      },
    });
  };
  const handleUnselect = () => {
    setFile(undefined);
    props.data.setValue(undefined);
  };
  return (
    <div className="flex flex-col">
      {file ? (
        <div className="flex items-center justify-between space-x-2 rounded border p-2 shadow">
          <div className="relative flex flex-1 items-center">
            <img
              src={file.iconUrl}
              alt={file.name}
              className="h-6 w-6 rounded-full"
            />
            <p className="ml-2 truncate text-sm font-semibold">{file.name}</p>
          </div>
          <div className="flex items-center">
            <a href={file.url} target="_blank" rel="noreferrer">
              <Button variant={"ghost"} size="icon" tooltip="Open in new tab">
                <ExternalLink className="h-5 w-5" />
              </Button>
            </a>
            <Button
              variant={"ghost"}
              onClick={handleUnselect}
              size="icon"
              tooltip="Remove file"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleOpenPicker}>Pick a file</Button>
      )}
    </div>
  );
}
