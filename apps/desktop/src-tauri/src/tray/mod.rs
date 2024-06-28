mod updater;

use tauri_plugin_shell::ShellExt;
use tauri::{
    image::Image,
    menu::{
        AboutMetadataBuilder, CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder,
        PredefinedMenuItem,
    },
    tray::{ MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle
};
use tauri_plugin_store::StoreBuilder;

pub use updater::check_for_update;

use crate::cmd;

pub fn build(app: &AppHandle) {
  
    let about_metadata = AboutMetadataBuilder::new()
        .short_version("Beta".into())
        .icon(Image::from_bytes(include_bytes!("../../icons/128.png")).ok())
        .copyright("©2024 Nokta PTE LTD".into())
        .website("https://www.craftgen.ai".into())
        .website_label("Visit Website".into())
        .license("AGPL-3.0".into())
        .version(app.package_info().version.to_string().into())
        .build();

    let tray_menu = MenuBuilder::new(app)
        .items(&[
            // &MenuItemBuilder::with_id("record", "Start Recording")
            //     .accelerator("CommandOrControl+Shift+2")
            //     .build(app)
            //     .expect(""),
            &PredefinedMenuItem::separator(app).expect(""),
            // &CheckMenuItemBuilder::with_id("record_cursor", "Record Mouse Cursor")
            //     .checked(get_tray_setting(app, "record_cursor".to_string()))
            //     .build(app)
            //     .expect(""),
            &CheckMenuItemBuilder::with_id("share_usage_data", "Share Usage Data")
                .checked(get_tray_setting(app, "share_usage_data".to_string()))
                .build(app)
                .expect(""),
            &PredefinedMenuItem::separator(app).expect(""),
            &MenuItemBuilder::with_id("website", "Visit Website")
                .build(app)
                .expect(""),
            &MenuItemBuilder::with_id("feedback", "Give Feedback")
                .build(app)
                .expect(""),
            &PredefinedMenuItem::separator(app).expect(""),
            &MenuItemBuilder::with_id("updates", "Check for Updates")
                .build(app)
                .expect(""),
            &PredefinedMenuItem::about(app, "About Craftgen".into(), Some(about_metadata))
                .expect(""),
            &PredefinedMenuItem::quit(app, Some("Quit")).expect(""),
        ])
        .build()
        .expect("Failed to build tray menu");

    let mut tray = TrayIconBuilder::with_id("tray")
        .menu(&tray_menu)
        .icon(Image::from_bytes(include_bytes!("../../icons/128.png")).expect(""))
        .tooltip("Craftgen")
        .on_menu_event(move |app, event| match event.id().as_ref() {
            // "record" => {
            //     toggle_cropper(app);
            // }
            "feedback" => {
                app.shell().open( "https://www.craftgen.ai/discord", None).expect("Failed to open feedback link");
            }
            "website" => {
                app.shell().open("https://www.craftgen.ai", None).expect("failed to open about link");
            }
            "updates" => {
                check_for_update(app.clone(), false).expect("Failed to check for updates");
            }
            "record_cursor" => update_tray_setting(app, "record_cursor".to_string()),
            "share_usage_data" => update_tray_setting(app, "share_usage_data".to_string()),
            _ => (),
        })
        .on_tray_icon_event(|tray, event| {
            match event {
              TrayIconEvent::Click { button, .. } => {
                if button == MouseButton::Left {
                    let app = tray.app_handle();
                    cmd::open_main_window(&app).unwrap();
                }
            }
                _ => (),
            }
        });

    #[cfg(target_os = "macos")]
    {
        tray = tray
            .menu_on_left_click(false)
            .icon(
                Image::from_bytes(include_bytes!("../../icons/128.png"))
                    .expect("Couldn't find icon"),
            )
            .icon_as_template(true)
    }

    tray.build(app).expect("Failed to build tray");
}

pub fn get_tray_setting(app: &AppHandle, key: String) -> bool {
    let mut store = StoreBuilder::new("app_data.bin").build(app.clone());
    store.load().unwrap_or_default();

    let setting_value = store
        .get(key.clone())
        .unwrap_or(&serde_json::Value::Bool(true))
        .as_bool()
        .unwrap();

    setting_value
}

fn update_tray_setting(app: &AppHandle, key: String) {
    let mut store = StoreBuilder::new("app_data.bin").build(app.clone());
    store.load().unwrap_or_default();

    // Get current value or true if not found
    let setting_value = get_tray_setting(app, key.clone());

    match setting_value {
        true => {
            store.insert(key.clone(), false.into()).unwrap();
        }
        false => {
            store.insert(key.clone(), true.into()).unwrap();
        }
    }
    store.save().expect("Failed to save store");

    // log updated value
    let updated_value = get_tray_setting(app, key.clone());

    println!("{}: {}", key, updated_value);
}

#[tauri::command]
pub async fn is_ok_sharing_usage_data(app: AppHandle) -> bool {
    get_tray_setting(&app, "share_usage_data".to_string())
}