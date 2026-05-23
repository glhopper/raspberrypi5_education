"""Small ADC0834 reader for Raspberry Pi 5 with gpiozero/lgpio.

Default wiring follows the SunFounder Da Vinci Kit examples:
- CS  -> GPIO17, physical pin 11
- CLK -> GPIO18, physical pin 12
- DIO -> GPIO27, physical pin 13
"""

from __future__ import annotations

from time import sleep

from gpiozero import DigitalInputDevice, DigitalOutputDevice


class ADC0834:
    def __init__(self, cs: int = 17, clk: int = 18, dio: int = 27, delay: float = 0.000002):
        self.cs_pin = cs
        self.clk_pin = clk
        self.dio_pin = dio
        self.delay = delay
        self.cs = DigitalOutputDevice(cs, initial_value=True)
        self.clk = DigitalOutputDevice(clk, initial_value=False)

    def close(self) -> None:
        self.cs.close()
        self.clk.close()

    def _pulse(self) -> None:
        self.clk.on()
        sleep(self.delay)
        self.clk.off()
        sleep(self.delay)

    def _write_bit(self, dio: DigitalOutputDevice, value: int) -> None:
        dio.value = 1 if value else 0
        sleep(self.delay)
        self._pulse()

    def read(self, channel: int = 0) -> int:
        if channel not in (0, 1, 2, 3):
            raise ValueError("ADC0834 channel must be 0, 1, 2, or 3")

        odd = channel & 1
        select = (channel >> 1) & 1

        dio_out = DigitalOutputDevice(self.dio_pin, initial_value=True)
        try:
            self.cs.off()
            self.clk.off()

            # Start bit, single-ended mode, ODD/SIGN bit, SELECT bit.
            for bit in (1, 1, odd, select):
                self._write_bit(dio_out, bit)

            # One extra clock lets ADC0834 settle before output bits.
            dio_out.on()
            sleep(self.delay)
            self._pulse()
        finally:
            dio_out.close()

        dio_in = DigitalInputDevice(self.dio_pin, pull_up=None)
        try:
            msb_first = 0
            for _ in range(8):
                self.clk.on()
                sleep(self.delay)
                self.clk.off()
                sleep(self.delay)
                msb_first = (msb_first << 1) | int(dio_in.value)

            lsb_first = 0
            for bit in range(8):
                self.clk.on()
                sleep(self.delay)
                self.clk.off()
                sleep(self.delay)
                lsb_first |= int(dio_in.value) << bit
        finally:
            dio_in.close()
            self.cs.on()

        return msb_first if msb_first == lsb_first else msb_first
