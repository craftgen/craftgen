use crate::cmd::open_main_window;
use crate::tray::EXIT_FLAG;
use crate::AppState;
use tauri::Manager;

#[cfg(target_os = "macos")]
use crate::{cmd, dock};

pub fn on_run_event(app_handle: &tauri::AppHandle, event: tauri::RunEvent) {
    log::trace!("Run event: {:?}", event);
    match event {
        tauri::RunEvent::Ready { .. } => {
            println!("[Event] Ready");
            // let app_state = app_handle.state::<AppState>();

            // tauri::async_runtime::spawn(async move {
            //     let handle = cmd::start_edge_runtime(app_handle.clone()).await.expect("Failed to start sidecar");

            //     // *app_state.sidecar_handle.lock().unwrap() = Some(handle);
            //     // // Close the app handle after storing the sidecar handle
            //     // app_handle.close().unwrap();
            // });
        }

        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            println!("[Event] Reopen");
            open_main_window(app_handle).unwrap();
        }
        tauri::RunEvent::ExitRequested { api, .. } => {
            println!("[Event] Exit requested, shutting down API...");
            if !EXIT_FLAG.load(std::sync::atomic::Ordering::Relaxed) {
                api.prevent_exit();
                #[cfg(target_os = "macos")]
                {
                    dock::set_dock_visible(false);
                }
                for (_label, window) in app_handle.webview_windows() {
                    window.close().unwrap();
                }
            }
        }
        _ => {}
    };
}
