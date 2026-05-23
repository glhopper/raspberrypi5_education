"""Read ADC0834 analog channel values."""

from time import sleep

from adc0834 import ADC0834


def main() -> None:
    adc = ADC0834()
    try:
        while True:
            raw = adc.read(0)
            voltage = raw / 255 * 3.3
            print(f"ch0 raw={raw:3d} voltage~={voltage:.2f} V")
            sleep(0.2)
    finally:
        adc.close()


if __name__ == "__main__":
    main()
