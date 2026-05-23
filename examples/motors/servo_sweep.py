"""Sweep a servo motor connected to GPIO18."""

from time import sleep

from gpiozero import AngularServo


def main() -> None:
    servo = AngularServo(
        18,
        min_angle=-90,
        max_angle=90,
        min_pulse_width=0.0005,
        max_pulse_width=0.0025,
    )

    try:
        while True:
            for angle in range(-90, 91, 10):
                servo.angle = angle
                sleep(0.1)
            for angle in range(90, -91, -10):
                servo.angle = angle
                sleep(0.1)
    finally:
        servo.detach()


if __name__ == "__main__":
    main()
