"""Wait for the test bundler, with a bounded timeout and useful failure."""
import time
import urllib.request

for attempt in range(60):
    try:
        with urllib.request.urlopen("http://127.0.0.1:8081/status", timeout=2) as response:
            if b"packager-status:running" in response.read():
                break
    except OSError:
        pass
    time.sleep(1)
else:
    raise SystemExit("Metro did not start on port 8081 within 60 seconds.")
