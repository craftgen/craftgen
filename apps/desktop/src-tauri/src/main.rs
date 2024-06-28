// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]


use tauri_plugin_autostart::MacosLauncher;

mod cmd;
mod runtime;
mod setup;
mod tray;
use clap::Parser;
use tauri_plugin_log::{fern::colors::{Color, ColoredLevelConfig}, Target, TargetKind};
use tokio::sync::Mutex;

#[cfg(target_os = "macos")]
mod dock;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Start app minimized
    #[arg(short, long)]
    minimized: bool,
}

#[derive(Debug)]
struct AppState {
    sidecar_handle: Option<tauri_plugin_shell::process::CommandChild>,
}

fn main() {
    let _guard = sentry::init(("https://9d430bec9a3518bcb0c34c7f8b9fe1d8@o4507501119799296.ingest.us.sentry.io/4507501176029184", sentry::ClientOptions {
        release: sentry::release_name!(),
        ..Default::default()
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_oauth::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("craftgen".to_string()),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .with_colors(ColoredLevelConfig {
                    error: Color::Red,
                    warn: Color::Yellow,
                    debug: Color::White,
                    info: Color::BrightGreen,
                    trace: Color::Cyan,
                })
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(AppState {
            sidecar_handle: None
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            cmd::greet,
        ])
        .setup(setup::setup)
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(runtime::on_run_event);
}
