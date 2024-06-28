import { ask } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

export async function checkForAppUpdates() {
  if (import.meta.env.DEV) return;
  const update = await check();

  if (update?.available) {
    const yes = await ask(
      `
Update to ${update.version} is available!
Release notes: ${update.body}
        `,
      {
        title: "Update Now!",
        kind: "info",
        okLabel: "Update",
        cancelLabel: "Cancel",
      },
    );

    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
}
