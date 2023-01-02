#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{fs, io, path::PathBuf, sync::Mutex};
use serde_json::json;
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
    let mut valhalla_base_path = current_dir;
    valhalla_base_path.push("dev-install/lotyr");
    Lotyr::new(valhalla_config(valhalla_base_path.to_str().unwrap())).expect("Failed to create Lotyr instance")
}

fn assets_dir() -> Result<PathBuf, io::Error> {
    let Some(document_dir) = tauri::api::path::document_dir() else {
        Err(io::Error::new(io::ErrorKind::Other, "Failed to determine user documents directory"))?
    };

    let assets_dir = document_dir.join("OTBAssets");

    fs::create_dir_all(&assets_dir)?;

    Ok(assets_dir)
}

fn valhalla_config(valhalla_base_path: &str) -> String {
    json!({
        "loki": {
            "actions": [
                "locate",
                "route",
                "height",
                "sources_to_targets",
                "optimized_route",
                "isochrone",
                "trace_route",
                "trace_attributes",
                "transit_available",
                "expansion",
                "centroid",
                "status"
            ],
            "logging": {
                "color": true,
                "long_request": 100.0,
                "type": "std_out"
            },
            "service": {
                "proxy": "ipc:///tmp/loki"
            },
            "service_defaults": {
                "heading_tolerance": 60,
                "minimum_reachability": 50,
                "node_snap_tolerance": 5,
                "radius": 0,
                "search_cutoff": 35000,
                "street_side_max_distance": 1000,
                "street_side_tolerance": 5
            },
            "use_connectivity": true
        },
        "meili": {
            "auto": {
                "search_radius": 50,
                "turn_penalty_factor": 200
            },
            "bicycle": {
                "turn_penalty_factor": 140
            },
            "customizable": [
                "mode",
                "search_radius",
                "turn_penalty_factor",
                "gps_accuracy",
                "interpolation_distance",
                "sigma_z",
                "beta",
                "max_route_distance_factor",
                "max_route_time_factor"
            ],
            "default": {
                "beta": 3,
                "breakage_distance": 2000,
                "geometry": false,
                "gps_accuracy": 5.0,
                "interpolation_distance": 10,
                "max_route_distance_factor": 5,
                "max_route_time_factor": 5,
                "max_search_radius": 100,
                "route": true,
                "search_radius": 50,
                "sigma_z": 4.07,
                "turn_penalty_factor": 0
            },
            "grid": {
                "cache_size": 100240,
                "size": 500
            },
            "logging": {
                "color": true,
                "type": "std_out"
            },
            "mode": "auto",
            "multimodal": {
                "turn_penalty_factor": 70
            },
            "pedestrian": {
                "search_radius": 50,
                "turn_penalty_factor": 100
            },
            "service": {
                "proxy": "ipc:///tmp/meili"
            },
            "verbose": false
        },
        "mjolnir": {
            "admin": null,
            "data_processing": {
                "allow_alt_name": false,
                "apply_country_overrides": true,
                "infer_internal_intersections": true,
                "infer_turn_channels": true,
                "scan_tar": false,
                "use_admin_db": true,
                "use_direction_on_ways": false,
                "use_rest_area": false,
                "use_urban_tag": false
            },
            "global_synchronized_cache": false,
            "hierarchy": true,
            "id_table_size": 1300000000,
            "import_bike_share_stations": false,
            "include_bicycle": true,
            "include_construction": false,
            "include_driveways": true,
            "include_driving": true,
            "include_pedestrian": true,
            "logging": {
                "color": true,
                "type": "std_out"
            },
            "lru_mem_cache_hard_control": false,
            "max_cache_size": 1000000000,
            "max_concurrent_reader_users": 1,
            "reclassify_links": true,
            "shortcuts": true,
            "tile_extract": format!("{valhalla_base_path}/valhalla_tiles.tar"),
            "use_lru_mem_cache": false,
            "use_simple_mem_cache": false
        },
        "odin": {
            "logging": {
                "color": true,
                "type": "std_out"
            },
            "markup_formatter": {
                "markup_enabled": false,
                "phoneme_format": "<TEXTUAL_STRING> (<span class=<QUOTES>phoneme<QUOTES>>/<VERBAL_STRING>/</span>)"
            },
            "service": {
                "proxy": "ipc:///tmp/odin"
            }
        },
        "service_limits": {
            "auto": {
                "max_distance": 5000000.0,
                "max_locations": 20,
                "max_matrix_distance": 400000.0,
                "max_matrix_location_pairs": 2500
            },
            "bicycle": {
                "max_distance": 500000.0,
                "max_locations": 50,
                "max_matrix_distance": 200000.0,
                "max_matrix_location_pairs": 2500
            },
            "bikeshare": {
                "max_distance": 500000.0,
                "max_locations": 50,
                "max_matrix_distance": 200000.0,
                "max_matrix_location_pairs": 2500
            },
            "bus": {
                "max_distance": 5000000.0,
                "max_locations": 50,
                "max_matrix_distance": 400000.0,
                "max_matrix_location_pairs": 2500
            },
            "centroid": {
                "max_distance": 200000.0,
                "max_locations": 5
            },
            "isochrone": {
                "max_contours": 4,
                "max_distance": 25000.0,
                "max_distance_contour": 200,
                "max_locations": 1,
                "max_time_contour": 120
            },
            "max_alternates": 2,
            "max_exclude_locations": 50,
            "max_exclude_polygons_length": 10000,
            "max_radius": 200,
            "max_reachability": 100,
            "max_timedep_distance": 500000,
            "max_timedep_distance_matrix": {
                "max_locations": 0,
                "max_distance": 0,
                "max_matrix_distance": 0,
                "max_matrix_location_pairs": 0
            },
            "motor_scooter": {
                "max_distance": 500000.0,
                "max_locations": 50,
                "max_matrix_distance": 200000.0,
                "max_matrix_location_pairs": 2500
            },
            "motorcycle": {
                "max_distance": 500000.0,
                "max_locations": 50,
                "max_matrix_distance": 200000.0,
                "max_matrix_location_pairs": 2500
            },
            "multimodal": {
                "max_distance": 500000.0,
                "max_locations": 50,
                "max_matrix_distance": 0.0,
                "max_matrix_location_pairs": 0
            },
            "pedestrian": {
                "max_distance": 250000.0,
                "max_locations": 50,
                "max_matrix_distance": 200000.0,
                "max_matrix_location_pairs": 2500,
                "max_transit_walking_distance": 10000,
                "min_transit_walking_distance": 1
            },
            "skadi": {
                "max_shape": 750000,
                "min_resample": 10.0
            },
            "status": {
                "allow_verbose": false
            },
            "taxi": {
                "max_distance": 5000000.0,
                "max_locations": 20,
                "max_matrix_distance": 400000.0,
                "max_matrix_location_pairs": 2500
            },
            "trace": {
                "max_alternates": 3,
                "max_alternates_shape": 100,
                "max_distance": 200000.0,
                "max_gps_accuracy": 100.0,
                "max_search_radius": 100.0,
                "max_shape": 16000
            },
            "transit": {
                "max_distance": 500000.0,
                "max_locations": 50,
                "max_matrix_distance": 200000.0,
                "max_matrix_location_pairs": 2500
            },
            "truck": {
                "max_distance": 5000000.0,
                "max_locations": 20,
                "max_matrix_distance": 400000.0,
                "max_matrix_location_pairs": 2500
            }
        },
        "thor": {
            "clear_reserved_memory": false,
            "extended_search": false,
            "logging": {
                "color": true,
                "long_request": 110.0,
                "type": "std_out"
            },
            "max_reserved_labels_count": 1000000,
            "source_to_target_algorithm": "select_optimal"
        }
    }).to_string()
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
