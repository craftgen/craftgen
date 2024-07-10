use tauri::Manager;
use tokio::sync::Mutex;

use crate::cmd::open_main_window;
// use crate::tray::EXIT_FLAG;
use crate::{ AppState};

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
        tauri::RunEvent::ExitRequested {  api, .. } => {
            log::info!("[Event] Exit requested, shutting down API...");
            api.prevent_exit();
            kill_sidecar_process(app_handle);
            log::info!("Exiting app");
            app_handle.exit(0)

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
        tauri::RunEvent::Exit { } => {
            log::info!("[Event] Exit");
            kill_sidecar_process(app_handle);
            app_handle.exit(0)
        }
        _ => {}
    };
}


fn kill_sidecar_process(app_handle: &tauri::AppHandle) {
    let state = app_handle.try_state::<Mutex<AppState>>().unwrap();
    
    // Use a block to ensure the MutexGuard is dropped early
    {
        // Lock the mutex to get mutable access to AppState
        match state.try_lock() {
            Ok(mut app_state) => {
                // Kill the sidecar process.
                if let Some(handle) = app_state.sidecar_handle.take() {
                    log::info!("Killing sidecar process");
                    if let Err(e) = handle.kill() {
                        log::error!("Failed to kill sidecar process: {:?}", e);
                    } else {
                        log::info!("Sidecar process killed successfully");
                    }
                }
            }
            Err(_) => {
                log::error!("Failed to lock AppState mutex");
            }
        };
    } // MutexGuard is dropped here

    // The `state` variable lives until here, which is fine now
}