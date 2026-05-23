"""Check Ubuntu/Raspberry Pi interfaces used by the tutorials."""

import importlib.util
import os
import platform
import subprocess
import sys
from pathlib import Path


def exists(path: str) -> bool:
    return Path(path).exists()


def status(ok: bool) -> str:
    return "ok" if ok else "missing"


def importable(module: str) -> bool:
    return importlib.util.find_spec(module) is not None


def command_output(command: list[str]) -> str:
    try:
        return subprocess.check_output(command, text=True).strip()
    except (FileNotFoundError, subprocess.CalledProcessError):
        return "unknown"


def group_status(group: str) -> bool:
    groups = command_output(["id", "-nG"]).split()
    return group in groups


def can_read_write(path: str) -> bool:
    return os.access(path, os.R_OK | os.W_OK)


def gpiochips() -> list[Path]:
    return sorted(Path("/dev").glob("gpiochip*"))


def accessible_gpiochips() -> list[Path]:
    return [chip for chip in gpiochips() if os.access(chip, os.R_OK | os.W_OK)]


def model() -> str:
    model_path = Path("/proc/device-tree/model")
    if model_path.exists():
        return model_path.read_text(errors="ignore").replace("\x00", "").strip()
    return "unknown"


def os_release() -> str:
    release = Path("/etc/os-release")
    if release.exists():
        lines = release.read_text(errors="ignore").splitlines()
        pretty = [line for line in lines if line.startswith("PRETTY_NAME=")]
        if pretty:
            return pretty[0].split("=", 1)[1].strip('"')
    return platform.platform()


def main() -> None:
    failures: list[str] = []

    print("Raspberry Pi analog device tutorial environment check")
    print(f"OS: {os_release()}")
    print(f"Machine: {platform.machine()}")
    print(f"Model: {model()}")
    print(f"User: {os.environ.get('USER', 'unknown')}")
    print(f"Groups: {command_output(['id', '-nG'])}")
    print()

    if platform.machine() != "aarch64":
        failures.append("64-bit aarch64 Ubuntu environment expected")
    if "Raspberry Pi 5" not in model():
        failures.append("Raspberry Pi 5 model not detected")

    print("Hardware interfaces")
    chips = gpiochips()
    accessible_chips = accessible_gpiochips()
    checks = {
        "GPIO chip /dev/gpiochip*": bool(chips),
    }
    for name, ok in checks.items():
        print(f"{name}: {status(ok)}")
        if not ok:
            failures.append(name)
    print("GPIO chips:", " ".join(str(chip) for chip in chips) if chips else "none")
    print()

    print("Current user device access")
    access_checks = {
        "read/write any /dev/gpiochip*": bool(accessible_chips),
    }
    for name, ok in access_checks.items():
        print(f"{name}: {status(ok)}")
        if not ok:
            failures.append(name)
    print("Accessible GPIO chips:", " ".join(str(chip) for chip in accessible_chips) if accessible_chips else "none")
    print()

    print("Current user groups")
    for group in ("gpio",):
        ok = group_status(group)
        print(f"group {group}: {'ok' if ok else 'not current user'}")
    print()

    print("Python packages")
    for module in ("gpiozero", "lgpio"):
        ok = importable(module)
        print(f"import {module}: {status(ok)}")
        if not ok:
            failures.append(f"import {module}")
    print()

    if failures:
        print("Needs attention:")
        for failure in failures:
            print(f"- {failure}")
        print()
        print("ADC0834 uses GPIO17, GPIO18, and GPIO27; it does not appear in i2cdetect.")
        print("If GPIO access is missing, add the gpio group and log in again.")
        sys.exit(1)

    print("Environment looks ready.")


if __name__ == "__main__":
    main()
