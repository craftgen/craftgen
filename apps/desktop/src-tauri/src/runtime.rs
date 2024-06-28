use tauri::Manager;
use tokio::sync::Mutex;

use crate::cmd::open_main_window;
// use crate::tray::EXIT_FLAG;
use crate::AppState;

#[cfg(target_os = "macos")]
use crate::dock;

pub fn on_run_event(app_handle: &tauri::AppHandle, event: tauri::RunEvent) {
    match event {
        tauri::RunEvent::Ready { .. } => {
            log::info!("[Event] Ready");
        }

        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            open_main_window(app_handle).unwrap();
        }
        tauri::RunEvent::ExitRequested { api, .. } => {
            log::info!("[Event] Exit requested, shutting down API...");
            let state = app_handle.try_state::<Mutex<AppState>>().unwrap();
            // Lock the mutex to get mutable access to AppState
            if let Ok(mut app_state) = state.try_lock() {
                // Kill the sidecar process.
                if let Some(handle) = app_state.sidecar_handle.take() {
                    log::info!("Killing sidecar process");
                    handle.kill().unwrap();
                    log::info!("Sidecar process killed");
                }
            } else {
                log::error!("Failed to lock AppState mutex");
            };

            // if !EXIT_FLAG.load(std::sync::atomic::Ordering::Relaxed) {
            //     api.prevent_exit();
            //     #[cfg(target_os = "macos")]
            //     {
            //         dock::set_dock_visible(false);
            //     }
            //     for (_label, window) in app_handle.webview_windows() {
            //         window.close().unwrap();
            //     }
            // }
        }
        _ => {}
    };
}
