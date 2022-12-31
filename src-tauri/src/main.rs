#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{fs, io, path::PathBuf, sync::Mutex};
use tauri::{api::dialog::blocking::FileDialogBuilder, AppHandle};

mod lotyr;
use lotyr::Lotyr;

#[tauri::command]
async fn list_assets() -> Result<Vec<String>, ErrorString> {
    let assets_dir = assets_dir()?;

    let mut assets = vec![];
    for entry in fs::read_dir(&assets_dir)? {
        let entry = entry?;

        // follow symlinks to get the metadata
        let meta = fs::metadata(entry.path())?;

        if meta.is_file() {
            if let Some(file_name) = entry.file_name().to_str() {
                assets.push(file_name.to_owned());
            }
        }
    }

    Ok(assets)
}

#[tauri::command]
async fn choose_file() -> Result<Option<String>, ErrorString> {
    match FileDialogBuilder::new().pick_file() {
        Some(path) => Ok(path.to_str().map(|s| s.to_owned())),
        None => Ok(None),
    }
}

#[tauri::command]
async fn import_asset(path: String, name: String) -> Result<(), ErrorString> {
    fs::copy(path, assets_dir()?.join(name))?;

    Ok(())
}

#[tauri::command]
async fn valhalla_route(
    req: String,
    lotyr: tauri::State<'_, Mutex<Lotyr>>,
) -> Result<String, ErrorString> {
    let lotyr = lotyr.lock().unwrap();
    Ok(lotyr.route(&req)?)
}

fn otb_asset_protocol(
    _app: &AppHandle<impl tauri::Runtime>,
    req: &tauri::http::Request,
) -> Result<tauri::http::Response, Box<dyn std::error::Error>> {
    let asset_name = req
        .uri()
        .trim_start_matches("otb-asset://")
        .trim_end_matches('/');

    // TODO: further protections?
    if asset_name.chars().any(|ch| matches!(ch, '/' | '\\')) {
        let mut resp = tauri::http::Response::default();
        resp.set_status(tauri::http::status::StatusCode::NOT_FOUND);
        return Ok(resp);
    }

    let mut file_path = assets_dir()?;
    file_path.push(asset_name);

    match std::fs::read(file_path) {
        Ok(body) => {
            let file_type = infer::get(&body);

            let mut resp = tauri::http::Response::new(body);
            resp.set_mimetype(
                file_type
                    .as_ref()
                    .map(infer::Type::mime_type)
                    .map(String::from),
            );

            Ok(resp)
        }
        Err(e) => match e.kind() {
            io::ErrorKind::NotFound => {
                let mut resp = tauri::http::Response::default();
                resp.set_status(tauri::http::status::StatusCode::NOT_FOUND);
                Ok(resp)
            }
            _ => Err(e)?,
        },
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            choose_file,
            list_assets,
            import_asset,
            valhalla_route
        ])
        .register_uri_scheme_protocol("otb-asset", otb_asset_protocol)
        .manage(Mutex::new(create_lotyr_instance()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_lotyr_instance() -> Lotyr {
    // Load the dynamic library
    let current_dir = std::env::current_dir().unwrap();
    let mut lotyr_lib_path = current_dir.clone();
    lotyr_lib_path.push("dev-install/lotyr");
    lotyr_lib_path.push(libloading::library_filename("lotyr"));
    lotyr::load_library(lotyr_lib_path.as_os_str()).expect("Failed to load Lotyr library");

    // Create the instance
    let mut lotyr_conf_path = current_dir;
    lotyr_conf_path.push("dev-install/lotyr/valhalla.json");
    Lotyr::new(lotyr_conf_path.as_os_str()).expect("Failed to create Lotyr instance")
}

fn assets_dir() -> Result<PathBuf, io::Error> {
    let Some(document_dir) = tauri::api::path::document_dir() else {
        Err(io::Error::new(io::ErrorKind::Other, "Failed to determine user documents directory"))?
    };

    let assets_dir = document_dir.join("OTBAssets");

    fs::create_dir_all(&assets_dir)?;

    Ok(assets_dir)
}

// This struct is needed because std::error::Error doesn't implement serde::Serialize,
// and so cannot be in the return value of Tauri commands.
struct ErrorString(String);

impl<T: std::error::Error> From<T> for ErrorString {
    fn from(err: T) -> Self {
        Self(err.to_string())
    }
}

impl serde::Serialize for ErrorString {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.0)
    }
}
