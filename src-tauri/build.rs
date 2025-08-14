use std::path::PathBuf;

fn main() {
  tauri_build::build();

  // Enforce presence of mongod binary when building a release bundle, so the app is fully self-contained.
  let profile = std::env::var("PROFILE").unwrap_or_else(|_| "dev".into());
  if profile == "release" {
    // Determine expected filename
    let target = std::env::var("TAURI_ENV_TARGET_TRIPLE").unwrap_or_else(|_| {
      let arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
      let os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
      format!("{}-{}", arch, os)
    });

    #[cfg(target_os = "windows")]
    let exe_name = "mongod.exe";
    #[cfg(not(target_os = "windows"))]
    let exe_name = "mongod";

    let path = PathBuf::from("bin").join(exe_name);
    if !path.exists() {
      println!("cargo:warning=MongoDB sidecar binary missing: {:?}", path);
      panic!(
        "Missing MongoDB server binary for target {}.\nPlace the appropriate 'mongod' in src-tauri/bin/ before building release.\nSee src-tauri/bin/README.txt for details.",
        target
      );
    }
  }
}
