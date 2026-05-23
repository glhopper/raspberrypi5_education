# GPIO メモ

Raspberry Pi 5 の GPIO は 3.3V ロジックです。

## よく使うピン

| 機能 | GPIO | 物理ピン |
| --- | --- | --- |
| I2C SDA | GPIO2 | 3 |
| I2C SCL | GPIO3 | 5 |
| SPI MOSI | GPIO10 | 19 |
| SPI MISO | GPIO9 | 21 |
| SPI SCLK | GPIO11 | 23 |
| SPI CE0 | GPIO8 | 24 |
| PWM 例 | GPIO18 | 12 |
| GND | - | 6 など |
| 3.3V | - | 1, 17 |
| 5V | - | 2, 4 |

## 注意

- GPIO 入力に 5V を入れない
- GPIO からモーターを直接駆動しない
- 電源ピンの短絡に注意する
