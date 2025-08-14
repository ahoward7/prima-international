Place the `mongod` binary for your platform in this folder for development.

- macOS/Linux: src-tauri/bin/mongod (make it executable: chmod +x)
- Windows: src-tauri/bin/mongod.exe

The Tauri bundler (tauri.conf.json -> bundle.resources) will include bin/** in packaged apps.
At runtime, the app will attempt to start this binary with:

  --dbpath <AppData>/mongo-data --bind_ip 127.0.0.1 --port 27272 --quiet

If you prefer using a system MongoDB during development, leave this folder empty and start mongod yourself on port 27272.
