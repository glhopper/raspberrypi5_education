# ADC でアナログ値を読む

Raspberry Pi 5 にはアナログ入力がありません。アナログセンサーを使うには ADC を接続します。

## ADC0834

ADC0834 は SunFounder Da Vinci Kit に含まれる 8bit ADC です。I2C や SPI の専用バスではなく、CS、CLK、DIO の 3 本の GPIO で制御します。

この教材では SunFounder の ADC0834 例に合わせて、次の BCM GPIO 番号を使います。

| ADC0834 | Raspberry Pi 5 | 物理ピン | 用途 |
| --- | --- |
| VCC / VDD | 3.3V | 1 または 17 | ADC の電源 |
| GND / AGND / DGND | GND | 6 など | 基準電位 |
| CS | GPIO17 | 11 | 変換開始/選択 |
| CLK | GPIO18 | 12 | クロック |
| DI / DO / DIO | GPIO27 | 13 | コマンド入力とデータ出力 |
| CH0 | 可変抵抗の中央端子 | - | アナログ入力 |
| COM | GND | 6 など | 単一入力の基準 |

ADC0834 の切り欠きや丸印がある側を上にして、ピン番号を間違えないようにします。SunFounder のブレッドボード配線図と同じ向きに置くと確認しやすくなります。

ADC0834 の `DI` と `DO` が別ピンの場合は、SunFounder の例に合わせて同じ GPIO27 の列へ接続します。ADC0834 は変換前に `DI` へコマンドを送り、変換中は `DO` から値を読むため、この教材のサンプルでは 1 本の DIO 線として扱います。

## 可変抵抗の接続

Da Vinci Kit の可変抵抗は 3 端子です。

| 可変抵抗 | 接続先 |
| --- | --- |
| 片側端子 | 3.3V |
| 反対側端子 | GND |
| 中央端子 | ADC0834 CH0 |

つまみを回すと、CH0 に入る電圧が 0V から 3.3V の範囲で変化します。ADC0834 はその電圧を 0 から 255 の数値に変換します。

## 実験: ADC0834 を読む

配線を確認してから実行します。

```bash
python examples/adc/read_adc0834.py
```

表示例:

```text
ch0 raw=  0 voltage~=0.00 V
ch0 raw=128 voltage~=1.66 V
ch0 raw=255 voltage~=3.30 V
```

値が変化しない場合は、次を確認します。

- ADC0834 の VCC が 3.3V に接続されている
- ADC0834 の GND/COM が Raspberry Pi の GND と共通になっている
- CS/CLK/DIO が GPIO17/GPIO18/GPIO27 に接続されている
- 可変抵抗の中央端子が CH0 に接続されている
- `python scripts/check_environment.py` で GPIO アクセスが `ok` になっている
