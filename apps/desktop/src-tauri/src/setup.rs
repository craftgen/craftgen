use std::error::Error;

use clap::Parser;
use tauri::{ App,  Manager};
use tokio::sync::Mutex;

use crate::{cmd, tray, AppState, Args};

pub  fn setup(app: &mut App) -> Result<(), Box<dyn Error>> {
    let args = Args::parse();
    log::debug!("args: {:?}", args);
    if args.minimized {
        #[cfg(target_os = "macos")]
        {
            crate::dock::set_dock_visible(false);
        }
    } else {
        cmd::open_main_window(app.app_handle()).unwrap();
    }

    tray::build(app.app_handle());
    let app_handle = app.app_handle().clone();
    tauri::async_runtime::spawn(async move {
        let runtime_handle = cmd::start_edge_runtime(app_handle.clone()).await;
        let app_state = app_handle.state::<Mutex<AppState>>();
        let mut app_state_guard = app_state.lock().await;
        app_state_guard.sidecar_handle = Some(runtime_handle.expect("craftgen runtime not started"));
    });
    Ok(())
}
