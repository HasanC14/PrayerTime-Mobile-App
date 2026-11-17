"""Synthetic fixture for a dedicated, freshly installed Android debug emulator.

Never clears app data. Refuses physical devices and nonempty app databases.
No production code, permissions or fixtures are added to the installed app.
"""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile

package = "com.hasanbuilds.prayertime"
adb = ["adb"] + (["-s", os.environ["ANDROID_SERIAL"]] if os.environ.get("ANDROID_SERIAL") else [])

def command(*args, **kwargs):
    return subprocess.run([*adb, *args], check=True, capture_output=True, **kwargs)

if command("shell", "getprop", "ro.kernel.qemu").stdout.strip() != b"1":
    raise SystemExit("Fixture seeding is allowed only on an Android emulator.")
command("shell", "run-as", package, "pwd")  # Debuggable installs only.
existing = subprocess.run([*adb, "shell", "run-as", package, "ls", "databases/RKStorage"], capture_output=True)
if existing.returncode == 0:
    raise SystemExit("Refusing to replace an existing database. Use a freshly installed test app.")

settings = {"language": "en", "themeMode": "light", "prayerTrackingEnabled": True,
            "notificationsEnabled": False, "prayerStartNotificationsEnabled": False}
location = {"name": "Dhaka, Bangladesh", "lat": 23.8103, "lng": 90.4125,
            "countryCode": "BD", "timeZone": "Asia/Dhaka", "source": "manual", "capturedAt": 1}
with tempfile.TemporaryDirectory(prefix="prayertime-fixture-") as folder:
    path = Path(folder) / "RKStorage"
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE catalystLocalStorage (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        db.execute("PRAGMA user_version=1")
        db.executemany("INSERT INTO catalystLocalStorage VALUES (?, ?)", [
            ("@PrayerTime:v2:settings", json.dumps(settings)),
            ("@PrayerTime:v2:location", json.dumps(location)),
            ("@PrayerTime:v2:notificationSetupSeen", "true"),
        ])
    command("shell", "run-as", package, "mkdir", "-p", "databases")
    command("shell", "run-as", package, "sh", "-c", "'cat > databases/RKStorage'", input=path.read_bytes())
