# Raspberry Pi 5 Analog Device Tutorial

Raspberry Pi 5 を使って、アナログセンサー、モーター、電子回路の基礎を学ぶための教育用リポジトリです。

Raspberry Pi にはアナログ入力ピンがないため、この教材では ADC、抵抗分圧、PWM、I2C、SPI、モータードライバなどを使いながら、実際に手を動かして電子工作の土台を学びます。

## 対象

- Raspberry Pi と電子工作を初めて学ぶ人
- センサー値を Python で読み取りたい人
- DC モーター、サーボモーター、ステッピングモーターを安全に動かしたい人
- 教室、ワークショップ、部活動などで使える教材を作りたい人

## 推奨ハードウェア

- Raspberry Pi 5
- microSD カード、USB-C 電源、HDMI または SSH 環境
- ブレッドボード、ジャンパーワイヤ
- 抵抗セット
- LED、タクトスイッチ
- ADC モジュール: ADS1115 または MCP3008
- アナログセンサー: 可変抵抗、CdS、サーミスタ、土壌水分センサーなど
- モータードライバ: TB6612FNG、DRV8833、L298N など
- DC モーター、サーボモーター、ステッピングモーター
- 外部電源、ヒューズ付き電源ライン、共通 GND 用配線

## 章立て

1. [全体像](docs/00_overview/README.md)
2. [電子回路の基礎](docs/01_electronics_basics/README.md)
3. [Raspberry Pi 5 のセットアップ](docs/02_raspberry_pi_setup/README.md)
4. [ADC でアナログ値を読む](docs/03_adc_analog_input/README.md)
5. [アナログセンサーを使う](docs/04_sensors/README.md)
6. [モーターを動かす](docs/05_motors/README.md)
7. [小さな制作課題](docs/06_projects/README.md)

## セットアップ

Raspberry Pi OS 上で実行します。

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip git
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

I2C/SPI を使う場合は Raspberry Pi の設定で有効化します。

```bash
sudo raspi-config
```

`Interface Options` から `I2C` と `SPI` を有効化してください。

## サンプル実行

ADS1115 で可変抵抗の値を読む例:

```bash
python examples/adc/read_ads1115.py
```

サーボモーターを動かす例:

```bash
python examples/motors/servo_sweep.py
```

## 安全上の注意

- Raspberry Pi の GPIO は 3.3V 系です。5V を GPIO に直接入れないでください。
- モーターは Raspberry Pi の 5V ピンから直接駆動しないでください。
- モーター用電源と Raspberry Pi は GND を共通にします。
- 配線を変えるときは、原則として電源を切ってください。
- 発熱、焦げた匂い、異音がある場合はすぐに電源を切ってください。

## ライセンス

教材本文とコードのライセンスは、運用方針に合わせて後で決めます。
