#![allow(non_snake_case)]

use std::{fs};
use std::path::{Component, Path, PathBuf};
use std::sync::mpsc::channel;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::{App, AppHandle, Manager, Resource, Runtime, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Window, WindowEvent};
use tauri::menu::{CheckMenuItemBuilder, Menu, MenuItem, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri_plugin_fs::FsExt;
#[derive(Clone, serde::Serialize)]
struct HSVColor {
    h: f64,
    s: f64,
    v: f64,
}

#[allow(non_snake_case)]
enum TabStyling{
    Text,
    Icon_Text,
    Icon_Text_Hover_Effect
}

enum FontSize{
    Small,
    Medium,
    Large,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
enum Theme{
    Light,
    System,
    Dark
}

enum TabPosition{
    Top,
    Left,
    Bottom,
    Right
}

struct AppState {
    #[allow(non_snake_case)]themeColor: Mutex<HSVColor>,
    theme: Mutex<Theme>
}
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_md_files(app: AppHandle) -> Result<Vec<String>, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let resource_path = docs_dir_candidates(&resource_dir, &manifest_dir)
        .into_iter()
        .find(|path| path.is_dir())
        .ok_or_else(|| "Documentation directory was not found".to_string())?;

    let entries = fs::read_dir(resource_path).map_err(|e| e.to_string())?;

    let mut files = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file()
            && path.extension().and_then(|s| s.to_str()) == Some("md")
        {
            files.push(path.to_string_lossy().to_string());
        }
    }

    Ok(files)
}

fn docs_dir_candidates(resource_dir: &Path, manifest_dir: &Path) -> Vec<PathBuf> {
    [
        resource_dir.join("src/components/Docs/Resources/MDFiles"),
        manifest_dir.join("../src/components/Docs/Resources/MDFiles"),
        manifest_dir.join("src/components/Docs/Resources/MDFiles"),
    ]
        .into_iter()
        .map(normalize_path)
        .collect()
}

fn normalize_path(path: PathBuf) -> PathBuf {
    let mut normalized = PathBuf::new();

    for component in path.components() {
        match component {
            Component::ParentDir => {
                normalized.pop();
            }
            Component::CurDir => {}
            other => normalized.push(other.as_os_str()),
        }
    }

    normalized
}

#[tauri::command]
fn load_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}
#[allow(non_snake_case)]
pub fn showCustomizeTheme(app_handle: AppHandle) {
    let cursorPos = app_handle
        .cursor_position()
        .unwrap_or(tauri::PhysicalPosition::new(0.0, 0.0));

    let monitors = app_handle
        .available_monitors()
        .unwrap_or_default();

    let cursorMonitor = monitors.iter().find(|monitor| {
        let position = monitor.position();
        let size = monitor.size();

        cursorPos.x >= position.x as f64
            && cursorPos.x < (position.x + size.width as i32) as f64
            && cursorPos.y >= position.y as f64
            && cursorPos.y < (position.y + size.height as i32) as f64
    });

    let scaleFactor = cursorMonitor
        .map(|monitor| monitor.scale_factor())
        .unwrap_or(1.0);

    let logical_x = cursorPos.x / scaleFactor;
    let logical_y = cursorPos.y / scaleFactor;

    if let Some(window) = app_handle.get_webview_window("customize_theme_window") {
        let _ = window.set_position(
            tauri::Position::Logical(
                tauri::LogicalPosition::new(logical_x, logical_y)
            )
        );
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    // Only create it once
    let window = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "customize_theme_window",
        WebviewUrl::App("customizeTheme.html".into()),
    )
        .decorations(false)
        .always_on_top(true)
        .focused(true)
        .position(logical_x, logical_y)
        .inner_size(200.0, 250.0)
        .resizable(false)
        .transparent(true)
        .build();

    match window {
        Ok(window) => {
            let popup_clone = window.clone();

            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let _ = popup_clone.hide();
                }
            });
        }

        Err(error) => {
            println!("FAILED TO CREATE CUSTOMIZE WINDOW: {:?}", error);
        }
    }
}
#[allow(non_snake_case)]
pub fn showCustomizeThemeTop(app_handle: AppHandle) {
    let cursor_pos = app_handle
        .cursor_position()
        .unwrap_or(tauri::PhysicalPosition::new(0.0, 0.0));

    let monitor = app_handle
        .monitor_from_point(cursor_pos.x, cursor_pos.y)
        .unwrap_or(None);

    let scale_factor = monitor
        .map(|m| m.scale_factor())
        .unwrap_or(1.0);

    let logical_x = cursor_pos.x / scale_factor;

    // Reuse existing window
    if let Some(window) = app_handle.get_webview_window("customize_theme_window") {
        let _ = window.set_position(
            tauri::Position::Logical(
                tauri::LogicalPosition::new(logical_x, 0.0)
            )
        );
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    // Only create it once
    let window = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "customize_theme_window",
        WebviewUrl::App("customizeTheme.html".into()),
    )
        .decorations(false)
        .always_on_top(true)
        .focused(true)
        .position(logical_x, 0.0)
        .inner_size(200.0, 230.0)
        .resizable(false)
        .transparent(true)
        .build();

    match window {
        Ok(window) => {
            let popup_clone = window.clone();

            window.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let _ = popup_clone.hide();
                }
            });
        }

        Err(error) => {
            println!("FAILED TO CREATE CUSTOMIZE WINDOW: {:?}", error);
        }
    }
}
#[tauri::command]
fn show_context_menu<R: Runtime>(window: Window<R>) {
    let handle = window.app_handle();
    let menu = Menu::new(handle).unwrap();

    let copy_item = PredefinedMenuItem::copy(handle, None).unwrap();
    let paste_item = PredefinedMenuItem::paste(handle, None).unwrap();
    let cut_item = PredefinedMenuItem::cut(handle, None).unwrap();
    let select_all = PredefinedMenuItem::select_all(handle, None).unwrap();
    let separator = PredefinedMenuItem::separator(handle).unwrap();

    let customize_theme_item = MenuItem::with_id(
        handle,
        "customize-theme",
        "Customize Theme",
        true,
        None::<&str>,
    )
        .unwrap();

    menu.append(&copy_item).unwrap();
    menu.append(&cut_item).unwrap();
    menu.append(&paste_item).unwrap();
    menu.append(&select_all).unwrap();
    menu.append(&separator).unwrap();
    menu.append(&customize_theme_item).unwrap();

    window.popup_menu(&menu).unwrap();
}

#[tauri::command]
fn create_maker_bot_kiosk_win(app_handle: AppHandle)-> Result<(), String> {
    if let Some(existing_win) = app_handle.get_webview_window("maker-bot-kiosk") {
        let _ = existing_win.set_focus();
        return Ok(());
    }

    tauri::async_runtime::spawn(async move {
        let _window = WebviewWindowBuilder::new(
            &app_handle,
            "maker-bot-kiosk",
            WebviewUrl::App("MakerKioskWindow.html".into()),
        )
            .title("MakerBot Kiosk")
            .decorations(false)
            .hidden_title(true).transparent(true)
            .always_on_top(true)
            .build();
    });
    return Ok(());
}
fn hsv_to_hex(h: f64, s: f64, v: f64) -> String {
    let h_deg = h * 360.0;
    let (r, g, b) = if s == 0.0 {
        (v, v, v)
    } else {
        let h_sector = h_deg / 60.0;
        let i = h_sector.floor() as i32;
        let f = h_sector - f64::from(i);

        let p = v * (1.0 - s);
        let q = v * (1.0 - s * f);
        let t = v * (1.0 - s * (1.0 - f));

        match i % 6 {
            0 => (v, t, p),
            1 => (q, v, p),
            2 => (p, v, t),
            3 => (p, q, v),
            4 => (t, p, v),
            _ => (v, p, q),
        }
    };

    format!(
        "#{:02x}{:02x}{:02x}",
        (r * 255.0).round() as u8,
        (g * 255.0).round() as u8,
        (b * 255.0).round() as u8
    )
}
pub fn get_os_theme<R: Runtime>(window: Window<R>) -> Result<Theme, String> {
    match window
        .theme()
        .map_err(|e| format!("Failed to get OS theme: {e}"))?
    {
        tauri::Theme::Dark => Ok(Theme::Dark),
        tauri::Theme::Light => Ok(Theme::Light),
        _ => Ok(Theme::Light),
    }
}

#[tauri::command]
fn set_theme_color(window: WebviewWindow,state: tauri::State<'_, AppState>,h:f64,s:f64,v:f64)-> Result<(), String> {
    {
        let mut color = state.themeColor.lock().unwrap();
        color.h = h;
        color.s = s;
        color.v = v;
    }
    // let mut curTheme = state.theme;
    //
    // if (curTheme.lock() == Theme::System){
    //     let result = get_os_theme(window);
    //
    // }
    let hex_color = hsv_to_hex(h, s, v);
    let drk_hex_color = hsv_to_hex(h,s,v-0.5f64);
    let js_code = format!(
        r#"document.documentElement.style.setProperty('--viventory-bg', '{}');
            document.documentElement.style.setProperty('--viventory-surface','{}');
            document.documentElement.style.setProperty('--viventory-border','{}');
            document.documentElement.style.setProperty('--viventory-muted-surface','{}');
            document.documentElement.style.setProperty('--bg','{}');"#,
        hex_color,
        hex_color,
        drk_hex_color,
        hex_color,
        hex_color
    );
    let app_handle = window.app_handle();
    for (_label, target_window) in app_handle.webview_windows() {
        let _ = target_window.eval(&js_code);
    }
    Ok(())
}

#[tauri::command]
fn get_theme_color(state: tauri::State<'_, AppState>) -> Result<HSVColor, String> {
    let color = state.themeColor.lock()
        .map_err(|_| "Failed to lock theme color mutex".to_string())?;
    Ok(color.clone())
}

#[tauri::command]
fn set_theme(theme:String){

}
#[tauri::command]
fn get_theme(){

}

#[tauri::command]
fn get_maker_bot_kiosk_win(app_handle: AppHandle) -> bool {
    // Returns true if the window is present, false if it is None
    app_handle.get_webview_window("maker-bot-kiosk").is_some()
}
#[tauri::command]
fn close_maker_bot_kiosk_win(app_handle: AppHandle) -> Result<(), String> {
    app_handle
        .get_webview_window("maker-bot-kiosk")
        .ok_or_else(|| "Window 'maker-bot-kiosk' not found".to_string())?
        .close()
        .map_err(|e| e.to_string())
}

#[cfg(not(mobile))]
fn create_menu(app: &tauri::App) -> tauri::Result<()> {
    let handle = app.handle();
    let menu = Menu::default(handle)?;
    let state = handle.state::<AppState>();

    let font_small = CheckMenuItemBuilder::new("Small")
        .id("FontSizeSmall")
        .checked(false)
        .build(handle)?;

    let font_medium = CheckMenuItemBuilder::new("Medium")
        .id("FontSizeMedium")
        .checked(true)
        .build(handle)?;

    let font_large = CheckMenuItemBuilder::new("Large")
        .id("FontSizeLarge")
        .checked(false)
        .build(handle)?;

    let theme_light = CheckMenuItemBuilder::new("Light")
        .id("ThemeLight")
        .checked(true)
        .build(handle)?;

    let theme_system = CheckMenuItemBuilder::new("System")
        .id("ThemeSystem")
        .checked(false)
        .build(handle)?;

    let theme_dark = CheckMenuItemBuilder::new("Dark")
        .id("ThemeDark")
        .checked(false)
        .build(handle)?;

    let small_ref = font_small.clone();
    let medium_ref = font_medium.clone();
    let large_ref = font_large.clone();

    let light_ref = theme_light.clone();
    let system_ref = theme_system.clone();
    let dark_ref = theme_dark .clone();

    let font_size = SubmenuBuilder::new(handle, "Font Size")
        .item(&font_small)
        .item(&font_medium)
        .item(&font_large)
        .build()?;

    let theme_option = SubmenuBuilder::new(handle,"Theme")
        .item(&light_ref)
        .item(&system_ref)
        .item(&dark_ref)
        .build()?;

    let customize_theme = MenuItemBuilder::new("Customize Theme")
        .id("customize-theme-top")
        .build(handle)?;

    let settings_submenu = SubmenuBuilder::new(handle, "Settings")
        .item(&customize_theme)
        .item(&font_size)
        .item(&theme_option)
        .build()?;
    menu.append(&settings_submenu)?;
    app.set_menu(menu)?;

    let handle_clone = handle.clone();
    handle_clone.on_menu_event(move |app_handle, event| {
        let clicked_id = event.id().as_ref();
        if clicked_id == "customize-theme-top" {
            showCustomizeThemeTop(app_handle.clone());
        } else if clicked_id == "customize-theme" {
            showCustomizeTheme(app_handle.clone());
        }

        if clicked_id == "FontSizeSmall" || clicked_id == "FontSizeMedium" || clicked_id == "FontSizeLarge" {
            let _ = small_ref.set_checked(clicked_id == "FontSizeSmall");
            let _ = medium_ref.set_checked(clicked_id == "FontSizeMedium");
            let _ = large_ref.set_checked(clicked_id == "FontSizeLarge");
            println!("Font size switched to: {}", clicked_id);
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState{
            themeColor:Mutex::new(HSVColor {
                h:0.0,
                s:0.0,
                v:1.0
            }),
            theme:Mutex::new(Theme::Light)
        })
        .setup(|app| {
            let fs_scope = app.try_fs_scope().expect("fs_scope not available");
            let _ = create_menu(app);
            fs_scope
                .allow_directory("/path/to/directory", true)
                .expect("Failed to allow directory");
            let hex_color = hsv_to_hex(0.0, 0.0, 1.0);
            let drk_hex_color = hsv_to_hex(0.0,0.0,1.0-0.5f64);
            let js_code = format!(
                r#"document.documentElement.style.setProperty('--viventory-bg', '{}');
            document.documentElement.style.setProperty('--viventory-surface','{}');
            document.documentElement.style.setProperty('--viventory-border','{}');
            document.documentElement.style.setProperty('--viventory-muted-surface','{}');
            document.documentElement.style.setProperty('--bg','{}');"#,
                hex_color,
                hex_color,
                drk_hex_color,
                hex_color,
                hex_color
            );
                app.get_webview_window("main").unwrap().eval(&js_code).map_err(|e| e.to_string())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_md_files,
            load_file_content,
            show_context_menu,
            create_maker_bot_kiosk_win,
            set_theme_color,
            get_theme_color,
            get_maker_bot_kiosk_win,
            close_maker_bot_kiosk_win
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn docs_dir_candidates_include_repo_docs_for_dev() {
        let resource_dir = PathBuf::from("/tmp/gurtxvivita/resources");
        let manifest_dir = PathBuf::from("/workspace/GurtxVivita/src-tauri");

        let candidates = docs_dir_candidates(&resource_dir, &manifest_dir);

        assert!(candidates.contains(
            &PathBuf::from("/workspace/GurtxVivita/src/components/Docs/Resources/MDFiles")
        ));
    }
}
