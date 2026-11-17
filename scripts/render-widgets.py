"""Render real Android RemoteViews on a dedicated emulator, without launching JS.

Requires an existing Expo Android prebuild. Temporary instrumentation is confined
to that generated project and restored afterward. App storage is never cleared;
the renderer restores the widget timeline after using synthetic fixture data.
"""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--device", default=os.environ.get("ANDROID_SERIAL"))
parser.add_argument("--output", type=Path, default=root / "review/widget-refinement/native")
parser.add_argument("--update-gallery", action="store_true", help="Update the four static Android widget gallery images")
args = parser.parse_args()
if not args.device or not re.fullmatch(r"emulator-\d+", args.device):
    parser.error("Choose a dedicated Android emulator with --device emulator-PORT.")
adb = ["adb", "-s", args.device]
package = "com.hasanbuilds.prayertime"


def run(command, **kwargs):
    return subprocess.run(command, check=True, cwd=root, **kwargs)


if run([*adb, "shell", "getprop", "ro.kernel.qemu"], capture_output=True).stdout.strip() != b"1":
    raise SystemExit("Widget rendering is allowed only on an Android emulator.")
if int(run([*adb, "shell", "getprop", "ro.build.version.sdk"], capture_output=True, text=True).stdout.strip()) < 26:
    raise SystemExit("The render checker requires API 26 or newer; CI uses API 35.")
gradle = root / "android/app/build.gradle"
if not gradle.exists():
    raise SystemExit("Run npx expo prebuild --platform android --no-install first.")
original_gradle = gradle.read_bytes()
instrumentation = root / "android/app/src/androidTest/java/com/hasanbuilds/prayertime/WidgetRenderInstrumentation.java"
original_instrumentation = instrumentation.read_bytes() if instrumentation.exists() else None
args.output.mkdir(parents=True, exist_ok=True)
try:
    instrumentation.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / "scripts/widget-review/WidgetRenderInstrumentation.java", instrumentation)
    gradle.write_bytes(original_gradle + b'\nandroid { defaultConfig { testInstrumentationRunner "com.hasanbuilds.prayertime.WidgetRenderInstrumentation" } }\n')
    abi = run([*adb, "shell", "getprop", "ro.product.cpu.abi"], capture_output=True, text=True).stdout.strip()
    if abi not in {"arm64-v8a", "x86_64", "x86", "armeabi-v7a"}:
        raise SystemExit("Unsupported emulator ABI.")
    run([str(root / "android/gradlew"), "-p", str(root / "android"), ":app:assembleDebug", ":app:assembleDebugAndroidTest", f"-PreactNativeArchitectures={abi}", "--no-daemon"])
    for apk in ["debug/app-debug.apk", "androidTest/debug/app-debug-androidTest.apk"]:
        run([*adb, "install", "-r", str(root / "android/app/build/outputs/apk" / apk)])
    with tempfile.TemporaryDirectory(prefix="prayertime-widget-fixtures-") as temp:
        fixture = Path(temp) / "cases.json"
        command = ["npx", "tsx", "scripts/widget-review/fixtures.ts", str(fixture)]
        if (root / "modules/prayertime-widgets/android/src/main/res/layout/prayertime_hero_gallery.xml").exists():
            command.append("--gallery")
        run(command)
        run([*adb, "shell", "run-as", package, "sh", "-c", "'mkdir -p files && cat > files/widget-cases.json'"], input=fixture.read_bytes())
    response = run([*adb, "shell", "am", "instrument", "-w", f"{package}.test/{package}.WidgetRenderInstrumentation"], capture_output=True, text=True).stdout
    print(response)
    if "INSTRUMENTATION_CODE: -1" not in response or "INSTRUMENTATION_RESULT: error=" in response:
        raise SystemExit("Native widget rendering failed.")
    report = run([*adb, "exec-out", "run-as", package, "cat", "cache/widget-review/report.json"], capture_output=True).stdout
    (args.output / "report.json").write_bytes(report)
    cases = json.loads(report)
    for case in cases:
        name = case["name"]
        if not re.fullmatch(r"[a-z0-9-]+", name):
            raise SystemExit("Unexpected render artifact name.")
        image = run([*adb, "exec-out", "run-as", package, "cat", f"cache/widget-review/{name}.png"], capture_output=True).stdout
        (args.output / f"{name}.png").write_bytes(image)
    failures = [case for case in cases if case["issues"]]
    if failures:
        print(json.dumps(failures, indent=2))
        raise SystemExit(f"Found text clipping or overflow in {len(failures)} widget layouts.")
    if args.update_gallery:
        destination = root / "modules/prayertime-widgets/android/src/main/res/drawable-nodpi"
        destination.mkdir(exist_ok=True)
        for kind in ["hero", "next", "summary", "times"]:
            shutil.copyfile(args.output / f"en-light-{kind}.png", destination / f"prayertime_{kind}_preview.png")
    print(f"Passed {len(cases)} native widget render checks. Captures: {args.output}")
finally:
    gradle.write_bytes(original_gradle)
    if original_instrumentation is None:
        instrumentation.unlink(missing_ok=True)
    else:
        instrumentation.write_bytes(original_instrumentation)
