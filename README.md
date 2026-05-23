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

## Ubuntu でのセットアップ

Ubuntu 22.04 LTS / 24.04 LTS 64-bit を入れた Raspberry Pi 5 で実行します。Raspberry Pi OS 用の `raspi-config` は使いません。

SSH で Raspberry Pi に入ります。

```bash
ssh <ユーザー名>@<Raspberry Pi の IP アドレス>
```

OS と CPU アーキテクチャを確認します。

```bash
cat /etc/os-release
uname -m
```

`uname -m` は 64-bit 環境なら `aarch64` です。

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git python3-venv python3-pip i2c-tools gpiod python3-lgpio
git clone https://github.com/glhopper/raspberrypi5_education.git
cd raspberrypi5_education
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

I2C/SPI を使う場合は `/boot/firmware/config.txt` に次の設定を追加または有効化して、再起動します。

```bash
sudo nano /boot/firmware/config.txt
```

```text
dtparam=i2c_arm=on
dtparam=spi=on
```

```bash
sudo reboot
```

再起動後、もう一度 SSH で入り、リポジトリのディレクトリに戻ります。

```bash
ssh <ユーザー名>@<Raspberry Pi の IP アドレス>
cd raspberrypi5_education
source .venv/bin/activate
```

デバイスファイルの権限でアクセスできない場合は、現在のユーザーを GPIO/I2C/SPI 系グループに追加します。

```bash
for group in gpio i2c spi; do
  if getent group "$group" >/dev/null; then sudo usermod -aG "$group" "$USER"; fi
done
```

グループ追加後はいったんログアウトして入り直し、再度 `cd raspberrypi5_education` と `source .venv/bin/activate` を実行してください。

環境確認:

```bash
python scripts/check_environment.py
```

SSH で運用する場合は、初期パスワードを変更し、可能なら公開鍵認証を使ってください。教室や家庭 LAN で使う場合も、不要なポートを開けないようにします。

## サンプル実行

先に環境確認と I2C デバイス確認を行います。

```bash
python scripts/check_environment.py
i2cdetect -y 1
```

ADS1115 で可変抵抗の値を読む例:

```bash
python examples/adc/read_ads1115.py
```

サーボモーターを動かす例:

```bash
python examples/motors/servo_sweep.py
```

モーターやサーボのサンプルは、配線と外部電源を確認してから最後に実行してください。

## 安全上の注意

- Raspberry Pi の GPIO は 3.3V 系です。5V を GPIO に直接入れないでください。
- モーターは Raspberry Pi の 5V ピンから直接駆動しないでください。
- モーター用電源と Raspberry Pi は GND を共通にします。
- 配線を変えるときは、原則として電源を切ってください。
- 発熱、焦げた匂い、異音がある場合はすぐに電源を切ってください。

## ライセンス

教材本文とコードのライセンスは、運用方針に合わせて後で決めます。
