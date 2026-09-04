use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use sha2::{Digest, Sha256};
use tauri::{Emitter, Manager};

const GAME_MANIFEST_URL: &str =
    "https://github.com/ShizunaSH/clr-game/releases/latest/download/game.json";

fn open_folder(path: &str) -> Result<(), String> {
    Command::new("explorer").arg(path).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

fn game_install_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    Ok(base.join("game"))
}

fn game_dirs(app: &tauri::AppHandle) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = Vec::new();
    if let Ok(dir) = game_install_dir(app) {
        dirs.push(dir);
    }
    if let Ok(res) = app.path().resource_dir() {
        dirs.push(res.join("game"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            dirs.push(dir.join("game"));
        }
    }
    dirs
}

fn find_game(app: &tauri::AppHandle) -> Option<PathBuf> {
    for dir in game_dirs(app) {
        let exe = dir.join("CLR.exe");
        if exe.exists() {
            return Some(exe);
        }
    }
    None
}

fn hash_file(path: &Path) -> Result<(u64, String), String> {
    let mut f = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 1 << 20];
    let mut size: u64 = 0;
    loop {
        let n = f.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        size += n as u64;
        hasher.update(&buf[..n]);
    }
    let digest = hasher.finalize();
    let hex = digest.iter().map(|b| format!("{:02x}", b)).collect::<String>();
    Ok((size, hex))
}

#[derive(serde::Deserialize, serde::Serialize, Clone)]
struct GameManifest {
    version: String,
    file: String,
    size: u64,
    sha256: String,
    url: String,
}

#[derive(serde::Serialize)]
struct VerifyReport {
    status: String,
    detail: String,
}

#[derive(serde::Serialize)]
struct GameStatus {
    installed: bool,
    version: Option<String>,
}

#[derive(serde::Serialize)]
struct GameUpdate {
    available: bool,
    installed: bool,
    version: String,
}

fn read_local_manifest(app: &tauri::AppHandle) -> Option<(PathBuf, GameManifest)> {
    for dir in game_dirs(app) {
        if let Ok(txt) = std::fs::read_to_string(dir.join("game.json")) {
            if let Ok(m) = serde_json::from_str::<GameManifest>(&txt) {
                return Some((dir, m));
            }
        }
    }
    None
}

async fn fetch_manifest() -> Result<GameManifest, String> {
    reqwest::get(GAME_MANIFEST_URL)
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json::<GameManifest>()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn launch_game(app: tauri::AppHandle) -> Result<(), String> {
    let game = find_game(&app).ok_or("Jeu introuvable : lance l'installation.")?;
    let game_dir = game.parent().ok_or("dossier du jeu introuvable")?;
    Command::new(&game)
        .current_dir(game_dir)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn game_status(app: tauri::AppHandle) -> GameStatus {
    GameStatus {
        installed: find_game(&app).is_some(),
        version: read_local_manifest(&app).map(|(_, m)| m.version),
    }
}

#[tauri::command]
async fn game_check_update(app: tauri::AppHandle) -> Result<GameUpdate, String> {
    let remote = fetch_manifest().await?;
    let local = read_local_manifest(&app).map(|(_, m)| m.version);
    let installed = find_game(&app).is_some() && local.is_some();
    let available = match &local {
        Some(v) => *v != remote.version,
        None => true,
    };
    Ok(GameUpdate { available, installed, version: remote.version })
}

#[tauri::command]
async fn game_download(app: tauri::AppHandle) -> Result<String, String> {
    let m = fetch_manifest().await?;
    let dir = game_install_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let part = dir.join(format!("{}.part", m.file));
    let target = dir.join(&m.file);

    let mut resp = reqwest::get(&m.url)
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    let total = resp.content_length().unwrap_or(m.size);

    let mut file = std::fs::File::create(&part).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    let mut received: u64 = 0;
    let mut last_pct: u64 = 101;
    while let Some(chunk) = resp.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        hasher.update(&chunk);
        received += chunk.len() as u64;
        let pct = if total > 0 { (received * 100 / total).min(100) } else { 0 };
        if pct != last_pct {
            last_pct = pct;
            let _ = app.emit("game_dl", pct);
        }
    }
    file.flush().map_err(|e| e.to_string())?;
    drop(file);

    let hex = hasher.finalize().iter().map(|b| format!("{:02x}", b)).collect::<String>();
    if received != m.size || !hex.eq_ignore_ascii_case(&m.sha256) {
        let _ = std::fs::remove_file(&part);
        return Err("checksum".into());
    }

    let _ = std::fs::remove_file(&target);
    std::fs::rename(&part, &target).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&m).map_err(|e| e.to_string())?;
    std::fs::write(dir.join("game.json"), json).map_err(|e| e.to_string())?;
    Ok(m.version)
}

#[tauri::command]
fn open_install_dir(app: tauri::AppHandle) -> Result<(), String> {
    let dir = game_install_dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    open_folder(&dir.to_string_lossy())
}

#[tauri::command]
fn open_saves_dir() -> Result<(), String> {
    let appdata = std::env::var("APPDATA").map_err(|e| e.to_string())?;
    let p = format!("{}\\Godot\\app_userdata", appdata);
    open_folder(&p)
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    Command::new("cmd").args(["/C", "start", "", &url]).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn verify_files(app: tauri::AppHandle) -> Result<VerifyReport, String> {
    if let Some((dir, m)) = read_local_manifest(&app) {
        let target = dir.join(&m.file);
        if !target.exists() {
            return Ok(VerifyReport { status: "missing".into(), detail: m.file });
        }
        let (size, hash) = hash_file(&target)?;
        if size != m.size || !hash.eq_ignore_ascii_case(&m.sha256) {
            return Ok(VerifyReport { status: "corrupt".into(), detail: m.file });
        }
        return Ok(VerifyReport { status: "ok".into(), detail: m.file });
    }

    match find_game(&app) {
        Some(_) => Ok(VerifyReport { status: "unverified".into(), detail: "CLR.exe".into() }),
        None => Ok(VerifyReport { status: "missing".into(), detail: "CLR.exe".into() }),
    }
}

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_updater::UpdaterExt;
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;
    Ok(update.map(|u| u.version))
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    if let Some(update) = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?
    {
        update
            .download_and_install(|_chunk, _total| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            launch_game,
            game_status,
            game_check_update,
            game_download,
            open_install_dir,
            open_saves_dir,
            open_url,
            verify_files,
            app_version,
            check_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
