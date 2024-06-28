use clap::Parser;
use tauri::{ AppHandle, Manager};
use tokio::sync::Mutex;

use crate::{cmd,  AppState, Args};

pub async fn setup(app_handle: AppHandle) -> Result<(), ()> {
    let args = Args::parse();
    log::debug!("args: {:?}", args);
    if args.minimized {
        #[cfg(target_os = "macos")]
        {
            crate::dock::set_dock_visible(false);
        }
    } else {
        cmd::open_main_window(&app_handle).unwrap();
    }

    log::info!("Starting edge runtime");
    let runtime_handle = cmd::start_edge_runtime(app_handle.clone()).await?;
    let app_state = app_handle.state::<Mutex<AppState>>();
    let mut app_state_guard = app_state.lock().await;
    app_state_guard.sidecar_handle = Some(runtime_handle);



    Ok(())
}
