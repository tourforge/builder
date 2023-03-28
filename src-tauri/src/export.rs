use std::{
    collections::HashMap,
    fs,
    io::{self, Seek, Write},
    path::Path,
};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Serialize, Deserialize)]
struct TourIndex {
    pub tours: Vec<TourIndexEntry>,
}

#[derive(Serialize, Deserialize)]
struct TourIndexEntry {
    pub name: String,
    pub thumbnail: Option<AssetName>,
    pub content: AssetName,
}

#[derive(Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct AssetName(pub String);

#[derive(Serialize, Deserialize)]
struct TourModel {
    pub name: String,
    pub desc: String,
    pub waypoints: Vec<WaypointModel>,
    pub gallery: Vec<AssetName>,
    pub pois: Vec<PoiModel>,
    pub tiles: Option<AssetName>,
    pub path: String,
    pub links: Option<HashMap<String, LinkModel>>,
}

#[derive(Serialize, Deserialize)]
struct AssetMeta {
    pub alt: Option<String>,
    pub attrib: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum WaypointModel {
    #[serde(rename = "waypoint")]
    Waypoint {
        name: String,
        desc: String,
        lat: f64,
        lng: f64,
        narration: Option<AssetName>,
        trigger_radius: f64,
        transcript: Option<AssetName>,
        gallery: Vec<AssetName>,
        control: ControlMode,
        links: Option<HashMap<String, LinkModel>>,
    },
    #[serde(rename = "control")]
    Control {
        lat: f64,
        lng: f64,
        control: ControlMode,
    },
}

#[derive(Serialize, Deserialize)]
enum ControlMode {
    #[serde(rename = "route")]
    Route,
    #[serde(rename = "path")]
    Path,
    #[serde(rename = "none")]
    None,
}

#[derive(Serialize, Deserialize)]
struct PoiModel {
    pub name: String,
    pub desc: String,
    pub lat: f64,
    pub lng: f64,
    pub gallery: Vec<AssetName>,
    pub links: Option<HashMap<String, LinkModel>>,
}

#[derive(Serialize, Deserialize)]
struct LinkModel {
    pub href: String,
}

pub fn export(
    assets_dir: impl AsRef<Path>,
    tour_paths: impl Iterator<Item = impl AsRef<Path>>,
    target: impl Write + Seek,
) -> Result<(), io::Error> {
    let mut bundler = Bundler::new(assets_dir.as_ref(), target);

    for tour_path in tour_paths {
        bundler.bundle(tour_path)?;
    }

    bundler.finish()?;

    Ok(())
}

struct Bundler<'p, T: Write + Seek> {
    /// The path to the assets directory for the currently exported project.
    assets_dir: &'p Path,
    /// The index containing a list of all tours.
    index: TourIndex,
    /// A map from source asset filenames to bundled asset filenames, which are SHA256 hashes of
    /// their content followed by their file extension.
    assets: HashMap<String, String>,
    /// The zip file writer.
    zip_writer: zip::ZipWriter<T>,
}

impl<'p, T> Bundler<'p, T>
where
    T: Write + Seek,
{
    fn new(assets_dir: &'p Path, target: T) -> Bundler<'p, T> {
        Bundler {
            assets_dir,
            index: TourIndex { tours: Vec::new() },
            assets: HashMap::new(),
            zip_writer: zip::ZipWriter::new(target),
        }
    }

    fn bundle(&mut self, tour_path: impl AsRef<Path>) -> io::Result<()> {
        let tour_file = fs::File::open(tour_path)?;

        // deserialize the tour so we can modify it before bundling
        let tour = serde_json::from_reader::<_, TourModel>(tour_file)?;

        // visit all assets in the tour, translating their names and adding them to `self.assets`
        let translated_tour = self.translate_tour_assets(tour)?;

        // save the tour's name and thumbnail while we have a deserialized version of it
        let tour_name = translated_tour.name.clone();
        let tour_thumbnail = translated_tour.gallery.first().cloned();

        // serialize the tour back to JSON to prepare for writing it to the zip
        let tour_json = serde_json::to_string(&translated_tour)?;

        // calculate the hash of the tour
        let mut hasher = Sha256::new();
        hasher.update(tour_json.as_bytes());
        let hash = hasher.finalize();

        // compute the filename from the hash
        let filename = hex::encode(hash) + ".otb.json";

        let zip_file_options = zip::write::FileOptions::default()
            .compression_method(zip::CompressionMethod::Stored)
            .compression_level(None);

        // write the tour json to the zip
        self.zip_writer.start_file(&filename, zip_file_options)?;
        self.zip_writer.write_all(tour_json.as_bytes())?;

        // add the tour to the index
        self.index.tours.push(TourIndexEntry {
            name: tour_name,
            thumbnail: tour_thumbnail,
            content: AssetName(filename),
        });

        Ok(())
    }

    fn finish(mut self) -> io::Result<()> {
        let zip_file_options = zip::write::FileOptions::default()
            .compression_method(zip::CompressionMethod::Stored)
            .compression_level(None);
            
        // write all of the assets and their metadata to the zip
        for (src_name, dst_name) in &self.assets {
            let src_path = self.assets_dir.join(src_name);
            let mut src_file = fs::File::open(src_path)?;
            self.zip_writer.start_file(dst_name, zip_file_options)?;
            io::copy(&mut src_file, &mut self.zip_writer)?;

            let meta_path = self.assets_dir.join(src_name.to_owned() + ".meta.json");
            let mut meta_file = match fs::File::open(meta_path) {
                Ok(file) => file,
                Err(err) => match err.kind() {
                    io::ErrorKind::NotFound => continue,
                    _ => Err(err)?,
                },
            };

            self.zip_writer.start_file(dst_name.to_owned() + ".meta.json", zip_file_options)?;
            io::copy(&mut meta_file, &mut self.zip_writer)?;
        }

        // serialize the index
        let index_json = serde_json::to_string(&self.index)?;

        // add the index to the bundle
        self.zip_writer.start_file("index.json", zip_file_options)?;
        self.zip_writer.write_all(index_json.as_bytes())?;

        // finish!
        self.zip_writer.finish()?;

        Ok(())
    }

    fn translate_tour_assets(&mut self, mut tour: TourModel) -> io::Result<TourModel> {
        self.translate_assets(tour.gallery.iter_mut())?;
        self.translate_assets(tour.tiles.iter_mut())?;

        for waypoint in &mut tour.waypoints {
            let WaypointModel::Waypoint { narration, gallery, .. } = waypoint else { continue };

            self.translate_assets(gallery.iter_mut())?;
            self.translate_assets(narration.iter_mut())?;
        }

        for poi in &mut tour.pois {
            self.translate_assets(poi.gallery.iter_mut())?;
        }

        Ok(tour)
    }

    fn translate_assets<'a>(
        &mut self,
        items: impl Iterator<Item = &'a mut AssetName>,
    ) -> io::Result<()> {
        for asset_name in items {
            self.translate_asset(asset_name)?;
        }

        Ok(())
    }

    fn translate_asset(&mut self, asset_name: &mut AssetName) -> io::Result<()> {
        let AssetName(asset_name) = asset_name;

        // if we have alredy visited this asset, don't visit it again
        if let Some(translated) = self.assets.get(asset_name) {
            asset_name.clear();
            asset_name.push_str(translated);

            return Ok(());
        }

        let asset_path = self.assets_dir.join(&asset_name);
        let mut asset_file = fs::File::open(asset_path)?;

        // compute the hash
        let mut hasher = Sha256::new();
        io::copy(&mut asset_file, &mut hasher)?;
        let hash = hasher.finalize();

        let asset_extension = asset_name
            .split_once('.')
            .map(|(_, ext)| ext)
            .unwrap_or("")
            .to_owned();

        let translated_name = hex::encode(hash) + "." + &asset_extension;

        self.assets
            .insert(asset_name.clone(), translated_name.clone());

        *asset_name = translated_name;

        Ok(())
    }
}
