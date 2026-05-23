"""Read analog voltage from ADS1115 channel A0."""

import time

import board
import busio
from adafruit_ads1x15.ads1115 import ADS1115
from adafruit_ads1x15.analog_in import AnalogIn


def main() -> None:
    i2c = busio.I2C(board.SCL, board.SDA)
    ads = ADS1115(i2c)
    channel = AnalogIn(ads, 0)

    while True:
        print(f"raw={channel.value:5d} voltage={channel.voltage:.3f} V")
        time.sleep(0.2)


if __name__ == "__main__":
    main()
