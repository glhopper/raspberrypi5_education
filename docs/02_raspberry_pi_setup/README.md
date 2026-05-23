# Raspberry Pi 5 のセットアップ

## OS

Ubuntu 22.04 LTS または Ubuntu 24.04 LTS を Raspberry Pi 5 に入れた環境を想定します。

SSH で Raspberry Pi に入れる状態にしてから作業します。

```bash
ssh <ユーザー名>@<Raspberry Pi の IP アドレス>
```

OS と CPU アーキテクチャを確認します。

```bash
cat /etc/os-release
uname -m
```

`VERSION_ID` が `22.04` または `24.04`、`uname -m` が `aarch64` であることを想定します。

## 基本パッケージ

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git python3-venv python3-pip i2c-tools gpiod python3-lgpio
```

このリポジトリを Raspberry Pi 側に取得します。

```bash
git clone https://github.com/glhopper/raspberrypi5_education.git
cd raspberrypi5_education
```

## I2C と SPI の有効化

Ubuntu では `raspi-config` に頼らず、Raspberry Pi のファームウェア設定を直接編集します。

```bash
sudo nano /boot/firmware/config.txt
```

次の行を追加します。既にコメントアウトされた同じ設定がある場合は、コメントを外して `on` にします。

```text
dtparam=i2c_arm=on
dtparam=spi=on
```

保存したら再起動します。

```bash
sudo reboot
```

再起動後、もう一度 SSH で接続し、リポジトリのディレクトリに戻ります。

```bash
ssh <ユーザー名>@<Raspberry Pi の IP アドレス>
cd raspberrypi5_education
```

確認:

```bash
ls /dev/i2c-*
ls /dev/spidev*
ls /dev/gpiochip*
```

`/dev/i2c-1`、`/dev/spidev0.0`、`/dev/gpiochip*` が見えれば、この教材で使う基本インターフェースは有効です。

権限でアクセスできない場合は、現在のユーザーを存在するグループに追加します。

```bash
for group in gpio i2c spi; do
  if getent group "$group" >/dev/null; then sudo usermod -aG "$group" "$USER"; fi
done
```

グループ追加後はいったんログアウトして入り直します。うまくいかない場合は、まず `sudo` 付きで環境確認して、権限問題かデバイス認識問題かを切り分けます。

## Python 環境

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Ubuntu の新しいカーネルでは古い `RPi.GPIO` ベースの手順が動かない場合があります。この教材では `gpiozero` と `lgpio`、I2C には Adafruit Blinka / CircuitPython ライブラリを使います。

環境確認:

```bash
python scripts/check_environment.py
```

## I2C デバイス確認

ADS1115 などの I2C デバイスを接続したあと、次のコマンドでアドレスを確認します。

```bash
i2cdetect -y 1
```

ADS1115 の代表的なアドレスは `0x48` です。

何も表示されない場合は、配線、GND の共通化、3.3V 電源、I2C 有効化、ユーザー権限の順に確認します。
