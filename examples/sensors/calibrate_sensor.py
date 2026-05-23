"""Print min/max values for an ADC0834 analog sensor on CH0."""

import time

from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1] / "adc"))

from adc0834 import ADC0834


def main() -> None:
    adc = ADC0834()
    try:
        minimum = adc.read(0)
        maximum = minimum

        while True:
            value = adc.read(0)
            minimum = min(minimum, value)
            maximum = max(maximum, value)
            voltage = value / 255 * 3.3
            print(f"value={value:3d} min={minimum:3d} max={maximum:3d} voltage~={voltage:.2f} V")
            time.sleep(0.2)
    finally:
        adc.close()


if __name__ == "__main__":
    main()
