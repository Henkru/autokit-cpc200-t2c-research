# Notes

- PCB Rev: 20221019

## Chips

- Main SoC: unknown
- RAM: Samsung [K4B1G1646I-BCMA](https://semiconductor.samsung.com/dram/ddr/ddr3/k4b1g1646i-bcma/) (DDR3 1Gb)
- Flash: Winbond [W25Q128JV](https://www.mouser.com/datasheet/2/949/w25q128jv_revf_03272018_plus-1489608.pdf) (16 MB, 3.3v)
- WiFi/Bluetooth: unknown
- LTE-Modem: Neoway [N58-EA](http://www.wless.ru/files/GSM/Neoway/N58/Neoway_N58_Product_Specifications_V2_4.pdf)

## Flash Pinout

```
   -------------
1 -| ~CS   VCC |- 8
2 -|  DO  ~RST |- 7
3 -| ~WP   CLK |- 6
4 -| GND    DI |- 5
   -------------
```

## First Boot

```
U-Boot(09/02/2022-18:42:57)


U-Boot 2018.05 (Sep 02 2022 - 18:42:57 +0800) Allwinner Technology

[00.214]DRAM:  128 MiB
[00.217]Relocation Offset is: fdf90000
[00.227]secure enable bit: 0
[00.230]CPU=1008 MHz,PLL6=600 Mhz,AHB=200 Mhz, APB1=100Mhz  MBus=198Mhz
[00.236]gic: sec monitor mode
[00.239]flash init start
[00.241]workmode = 0,storage type = 3
SF: Detected w25q128 with page size 256 Bytes, erase size 4 KiB, total 16 MiB
[00.256]sunxi flash init ok
[00.260]Loading Environment from SUNXI_FLASH... OK
[00.314]update dts
boot_partition is boot
root_partition is rootfs
set root to /dev/mtdblock4
[00.325]update part info
[00.327]update bootcmd
Hit any key to stop autoboot:  0 
## Booting kernel from Legacy Image at 4007f800 ...
   Image Name:   ARM OpenWrt Linux-4.9.118
   Image Type:   ARM Linux Kernel Image (uncompressed)
   Data Size:    2224312 Bytes = 2.1 MiB
   Load Address: 40008000
   Entry Point:  40008004
[00.883]Starting kernel ...

/etc/init.d/rcS: /etc/init.d/rc.final: line 14: can't create /sys/class/hwmon/hwmon0/port_qos: nonexistent directory
/etc/init.d/rcS: /etc/init.d/rc.final: line 15: can't create /sys/class/hwmon/hwmon0/port_qos: nonexistent directory
data partitions have 844

root@None:/# ly_boot
BOOT_MODE=normal
DEBUG_MODE=no
sh: 1: unknown operand
LY_LINK_TYPE=cp
WORKDIR=/mnt/customer/app
setusbconfig
mkdir: can't create directory '/sys/kernel/config/usb_gadget/g1/functions/ffs.adb': No such file or directory
mkdir: can't create directory '/sys/kernel/config/usb_gadget/g1/functions/mtp.gs0': No such file or directory
mkdir: can't create directory '/sys/kernel/config/usb_gadget/g1/functions/mass_storage.usb0': No such file or directory
/bin/setusbconfig: line 111: can't create /sys/kernel/config/usb_gadget/g1/functions/mass_storage.usb0/lun.0/inquiry_string: nonexistent directory
WIFI_MODULE=8821cs
wait udisk trial=0
run gocsdk BT_NAME=AutoKit_76EA
## Error: "swu_mode" not defined
current ly_project=ly1552 buil date:Oct 27 2022
update_ok_wait_time=5
 run lylinkui
kill /sbin/update
start /mnt/customer/app/update
mDNSResponder: mDNSResponder (Engineering Build) (Jun  9 2022 17:12:58) starting
mDNSResponder: Unable to parse DNS server list. Unicast DNS-SD unavailable
mDNSResponder: mDNSPlatformSourceAddrForDest: connect 1.1.1.1 failed errno 101 (Network unreachable)
## Error: "swu_mode" not defined
current ly_project=ly1552 buil date:Oct 27 2022
update_ok_wait_time=5
SetKeyChainPath 93:carlife save keychain path:/mnt/UDISK/lylink ,name:carplay.key
mDNSResponder: Unable to parse DNS server list. Unicast DNS-SD unavailable
mDNSResponder: mDNSPlatformSourceAddrForDest: connect 1.1.1.1 failed errno 101 (Network unreachable)
```

## Firmware Updates

```
curl 'https://cpbox.oss-cn-shenzhen.aliyuncs.com/1552/version.json?rand=0.05004765868326899' \
  -H 'sec-ch-ua: "Microsoft Edge";v="117", "Not;A=Brand";v="8", "Chromium";v="117"' \
  -H 'Referer: https://tespush.com/' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --compressed

{"appver": "23061210.1552.1", "tsl": "23061210.4.9", "url": "https://cpbox.oss-cn-shenzhen.aliyuncs.com/1552/update_230612.img", "msg": "[2023-06-12] V4.9 </br>1.Add mode menu for the encoder.</br>2.Use pictures encoding by default.</br>1.增加编码器的模式菜单</br>2.默认使用图片编码", "test": [
{"appver": "23123012.1552.1", "tsl": "23123012.4.9", "sn": "xxx", "url": "https://cpbox.oss-cn-shenzhen.aliyuncs.com/1552/test.img", "msg": " This is test version."}
]}
```
