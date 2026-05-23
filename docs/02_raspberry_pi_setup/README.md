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
sudo apt install -y git python3-venv python3-pip gpiod python3-lgpio
```

このリポジトリを Raspberry Pi 側に取得します。

```bash
git clone https://github.com/glhopper/raspberrypi5_education.git
cd raspberrypi5_education
```

## GPIO の確認

ADC0834 は I2C/SPI デバイスではなく、GPIO17、GPIO18、GPIO27 で読み取ります。`i2cdetect` は使いません。

確認:

```bash
ls /dev/gpiochip*
```

`/dev/gpiochip*` が見えれば GPIO デバイスは有効です。

権限でアクセスできない場合は、現在のユーザーを存在するグループに追加します。

```bash
for group in gpio; do
  if getent group "$group" >/dev/null; then sudo usermod -aG "$group" "$USER"; fi
done
```

グループ追加後はいったんログアウトして入り直します。うまくいかない場合は、まず `sudo` 付きで環境確認して、権限問題か GPIO デバイス認識問題かを切り分けます。

## Python 環境

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Ubuntu の新しいカーネルでは古い `RPi.GPIO` ベースの手順が動かない場合があります。この教材では `gpiozero` と `lgpio` を使って ADC0834 を読み取ります。

環境確認:

```bash
python scripts/check_environment.py
```

## ADC0834 の接続確認

ADC0834 は I2C アドレスを持たないため、`i2cdetect` には表示されません。接続後はサンプルを実行して値が変化するか確認します。

```bash
python examples/adc/read_adc0834.py
```

可変抵抗を回して `raw` の値が 0 から 255 の範囲で変化すれば、接続はできています。変化しない場合は、配線、GND の共通化、3.3V 電源、GPIO 権限の順に確認します。
