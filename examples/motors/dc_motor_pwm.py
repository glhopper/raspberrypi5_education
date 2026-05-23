"""Control DC motor speed with a motor driver.

Example wiring for a driver such as TB6612FNG or DRV8833:
- GPIO17: direction input 1
- GPIO27: direction input 2
- GPIO22: PWM input

Do not connect a motor directly to Raspberry Pi GPIO.
"""

from time import sleep

from gpiozero import Motor, PWMOutputDevice


def main() -> None:
    motor = Motor(forward=17, backward=27)
    speed = PWMOutputDevice(22)

    try:
        motor.forward()
        for duty in [0.2, 0.4, 0.6, 0.8, 1.0]:
            speed.value = duty
            print(f"speed={duty:.1f}")
            sleep(1)

        motor.backward()
        for duty in [1.0, 0.8, 0.6, 0.4, 0.2]:
            speed.value = duty
            print(f"speed={duty:.1f}")
            sleep(1)
    finally:
        speed.off()
        motor.stop()


if __name__ == "__main__":
    main()
