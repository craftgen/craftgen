// "use client";

import useDrivePicker from "react-google-drive-picker";
import useSWR from "swr";

import { Button } from "@craftgen/ui/button";

import { getUser } from "../actions";
import { ProjectSettingsSection } from "./project-settings";

const ProjectSettingPage = () => {
  // const [openPicker, authResponse] = useDrivePicker();
  // const { data } = useSWR("user", getUser);

  // const handleOpenPicker = () => {
  //   openPicker({
  //     clientId:
  //       "619535389805-mfft6289t4uhhdgdf0s4f062m1dgnqvc.apps.googleusercontent.com",
  //     appId: "619535389805",
  //     // viewId: "DOCS",
  //     developerKey: "AIzaSyDinRsOhUnql1Ax4yUtsOMmG12zmZL2QoE",
  //     // ...(data?.google_access_token && { token: data?.google_access_token }),
  //     // token:
  //     //   "ya29.a0AfB_byDu8yUTzC_ob6gPJ0NJ8M44kibvMgv466BlMnYEkW_6HFAISy87vfJVJsZEZwCr5X9BphV1CCv5rP5py3xppkGfId2ZThGESOmfO5Rcalz2VuhwLT2bY_FvzI10Ke7bwMfWx7-CzKeVwddC5jWzUjZ37YOMWwaCgYKAfwSARESFQGOcNnC3nfYZcm3gHYuB763fMRhQw0169", // pass oauth token in case you already have one
  //     showUploadView: true,
  //     showUploadFolders: true,
  //     supportDrives: true,
  //     multiselect: true,
  //     // customViews: customViewsArray, // custom view
  //     callbackFunction: (data) => {
  //       if (data.action === "cancel") {
  //         console.log("User clicked cancel/close button");
  //       }
  //       console.log(data);
  //     },
  //   });
  // }; // const sheets = await getSheets({ query: "knowledge" });

  return (
    <div>
      {/* {JSON.stringify(data)} */}
      {/* <Button onClick={handleOpenPicker}>Open Picker</Button> */}
      <ProjectSettingsSection />
    </div>
  );
};

export default ProjectSettingPage;
