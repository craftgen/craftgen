use crate::cmd::open_main_window;
use crate::tray::EXIT_FLAG;
use tauri::Manager;

#[cfg(target_os = "macos")]
use crate::dock;

pub fn on_run_event(app_handle: &tauri::AppHandle, event: tauri::RunEvent) {
    log::trace!("Run event: {:?}", event);
    match event {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            open_main_window(app_handle).unwrap();
        }
        tauri::RunEvent::ExitRequested { api, .. } => {
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