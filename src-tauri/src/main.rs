#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{io, fs, ffi::OsString, path::PathBuf};

use tauri::api::dialog::blocking::FileDialogBuilder;

#[tauri::command]
async fn list_assets() -> Result<Vec<String>, String> {
    let assets_dir = assets_dir().map_err_string()?;

    let mut assets = vec![];
    for entry in fs::read_dir(&assets_dir).map_err_string()? {
        let entry = entry.map_err_string()?;

        // follow symlinks to get the metadata
        let meta = fs::metadata(entry.path()).map_err_string()?;

        if meta.is_file() {
            if let Some(file_name) = entry.file_name().to_str() { 
                assets.push(file_name.to_owned());
            }
        }
    }

    Ok(assets)
}

#[tauri::command]
async fn choose_file() -> Result<Option<String>, String> {
    println!("Choosing file...");
    match FileDialogBuilder::new().pick_file() {
        Some(path) => match path.to_str() {
            Some(s) => Ok(Some(s.to_owned())),
            None => Err("Path is not valid UTF-8".to_string()),
        }
        None => Ok(None),
    }
}

#[tauri::command]
async fn import_asset(path: String, name: String) -> Result<(), String> {
    fs::copy(path, assets_dir().map_err_string()?.join(name)).map_err_string()?;

    Ok(())
}

fn assets_dir() -> Result<PathBuf, io::Error> {
    let Some(document_dir) = tauri::api::path::document_dir() else {
        Err(io::Error::new(io::ErrorKind::Other, "Failed to determine user documents directory"))?
    };

    let assets_dir = document_dir.join("OTBAssets");

    fs::create_dir_all(&assets_dir)?;

    Ok(assets_dir)
}

trait ToStringError {
    type T;

    fn map_err_string(self) -> Result<Self::T, String>;
}

impl<T, E: ToString> ToStringError for Result<T, E> {
    type T = T;

    fn map_err_string(self) -> Result<Self::T, String> {
        match self {
            Ok(t) => Ok(t),
            Err(e) => Err(e.to_string()),
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![choose_file, list_assets, import_asset])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
