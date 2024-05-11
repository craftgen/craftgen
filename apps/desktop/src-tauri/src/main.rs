// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]




use tauri_plugin_autostart::MacosLauncher;

mod cmd;
mod setup;
mod tray;
use clap::Parser;
use log::{debug};



#[cfg(target_os = "macos")]
mod dock;


#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Start app minimized
    #[arg(short, long)]
    minimized: bool,
}


fn main() {
    debug!("init");

    // let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    // let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    // let tray_menu = SystemTrayMenu::new()
    //     .add_item(quit)
    //     .add_native_item(SystemTrayMenuItem::Separator)
    //     .add_item(hide);

    //     let tray = SystemTray::new().with_menu(tray_menu);


    
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![cmd::greet, cmd::start_edge_runtime])
        .setup(setup::setup)
        // .on_window_event(move |event| match event.event() {
        //     WindowEvent::Destroyed => {
        //         // tx.send(-1).expect("[Error] sending msg.");
        //         println!("[Event] App closed, shutting down API...");
        //     },
        //     _ => {}
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


