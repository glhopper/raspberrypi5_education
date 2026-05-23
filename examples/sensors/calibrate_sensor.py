"""Print min/max values for an ADS1115 analog sensor on A0."""

import time

import board
import busio
from adafruit_ads1x15.ads1115 import ADS1115
from adafruit_ads1x15.analog_in import AnalogIn


def main() -> None:
    i2c = busio.I2C(board.SCL, board.SDA)
    ads = ADS1115(i2c)
    channel = AnalogIn(ads, 0)

    minimum = channel.value
    maximum = channel.value

    while True:
        value = channel.value
        minimum = min(minimum, value)
        maximum = max(maximum, value)
        print(
            f"value={value:5d} min={minimum:5d} max={maximum:5d} "
            f"voltage={channel.voltage:.3f} V"
        )
        time.sleep(0.2)


if __name__ == "__main__":
    main()
