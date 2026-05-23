"""Check Raspberry Pi interfaces used by the tutorials."""

from pathlib import Path


def exists(path: str) -> str:
    return "ok" if Path(path).exists() else "missing"


def main() -> None:
    print("Raspberry Pi analog device tutorial environment check")
    print(f"I2C bus /dev/i2c-1: {exists('/dev/i2c-1')}")
    print(f"SPI bus /dev/spidev0.0: {exists('/dev/spidev0.0')}")
    print("Python packages are checked by importing the examples.")


if __name__ == "__main__":
    main()
