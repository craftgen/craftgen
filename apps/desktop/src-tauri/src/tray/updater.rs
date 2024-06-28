use tauri::{AppHandle, Result};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_updater::UpdaterExt;

pub fn check_for_update(app_handle: AppHandle, silent_if_none: bool) -> Result<()> {
    tauri::async_runtime::spawn(async move {
        let updater = app_handle.updater();
        match updater {
            Ok(updater) => {
                let response = updater.check().await;
                match response {
                    Ok(update_option) => {
                        if let Some(update) = update_option {
                            let update_str = format!(
                                "Your Version: {}\nLatest Version: {}",
                                update.current_version, update.version
                            );

                            println!("update available:\n\tdownload url: {}", update.download_url);

                            app_handle
                                .dialog()
                                .message(update_str)
                                .title("A new version is available!")
                                .ok_button_label("Install")
                                .cancel_button_label("Cancel")
                                .show(move |result| {
                                    tauri::async_runtime::spawn(async move {
                                        match result {
                                            true => {
                                                let update_result = update
                                                    .clone()
                                                    .download_and_install(
                                                        |size, _| {
                                                            println!("downloading update...");
                                                            println!("size: {}", size);
                                                        },
                                                        || {
                                                            println!("update downloaded, proceeding to install!");
                                                        },
                                                    )
                                                    .await;

                                                match update_result {
                                                    Ok(_) => {
                                                        app_handle
                                                            .dialog()
                                                            .message("Update installed successfully!")
                                                            .ok_button_label("Relaunch")
                                                            .show(move |_| {
                                                                app_handle.restart();
                                                            });
                                                    }
                                                    Err(e) => {
                                                        // TODO: handle a failed update
                                                        eprintln!("failed to install update: {}", e);
                                                    }
                                                    
                                                }
                                            }
                                            _ => {}
                                        }
                                    });
                                });
                        } else {
                            match silent_if_none {
                                true => {}
                                _ => {
                                    app_handle
                                        .dialog()
                                        .message("You're on the latest version!")
                                        .ok_button_label("Okay")
                                        .show(|_| {});
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("failed to check for updates: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("failed to build updater: {}", e);
            }
        }
    });
    Ok(())
}