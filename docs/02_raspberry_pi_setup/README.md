# Raspberry Pi 5 のセットアップ

## OS

Raspberry Pi OS Bookworm を想定します。

## 基本パッケージ

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip git i2c-tools
```

## I2C と SPI の有効化

```bash
sudo raspi-config
```

`Interface Options` から `I2C` と `SPI` を有効化します。

確認:

```bash
ls /dev/i2c-*
ls /dev/spidev*
```

## Python 環境

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## I2C デバイス確認

ADS1115 などの I2C デバイスを接続したあと、次のコマンドでアドレスを確認します。

```bash
i2cdetect -y 1
```

ADS1115 の代表的なアドレスは `0x48` です。
