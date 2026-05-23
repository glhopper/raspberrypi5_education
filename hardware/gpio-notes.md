# GPIO メモ

Raspberry Pi 5 の GPIO は 3.3V ロジックです。

## よく使うピン

| 機能 | GPIO | 物理ピン |
| --- | --- | --- |
| ADC0834 CS | GPIO17 | 11 |
| ADC0834 CLK | GPIO18 | 12 |
| ADC0834 DIO | GPIO27 | 13 |
| PWM 例 | GPIO22 | 15 |
| GND | - | 6 など |
| 3.3V | - | 1, 17 |
| 5V | - | 2, 4 |

## 注意

- GPIO 入力に 5V を入れない
- ADC0834 は 3.3V で動かす
- GPIO からモーターを直接駆動しない
- 電源ピンの短絡に注意する
