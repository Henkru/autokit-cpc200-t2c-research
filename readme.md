# Autokit CPC200 T2C research

![device](images/1.jpeg)

## Notes

- WiFi only model
- PCB Rev: 20221019

## Chips

- Main SoC: Allwinner [V833](https://linux-sunxi.org/images/2/25/V833_V831_Datasheet_V1.1%28For_SoChip%29.pdf) (sun8iw19, Cortex-A7)
- RAM: Samsung [K4B1G1646I-BCMA](https://semiconductor.samsung.com/dram/ddr/ddr3/k4b1g1646i-bcma/) (DDR3 1Gb)
- Flash: Winbond [W25Q128JV](https://www.mouser.com/datasheet/2/949/w25q128jv_revf_03272018_plus-1489608.pdf) (16 MB, 3.3v)
- WiFi/Bluetooth: Realtek RTL8821CS
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

## Flash Structure

The stage0 needs to be figured out.

| Start    | Size     | Partition   | Description             |
| -------- | -------- | ----------- | ----------------------- |
| 0x060000 | 0x040000 | env         | U-Boot env (reduntant)  |
| 0x0A0000 | 0x220000 | boot        | uImage                  |
| 0x2C0000 | 0x220000 | recovery    | uImage                  |
| 0x4E0000 | 0x300000 | rootfs      | Root SquashFS           |
| 0x7E0000 | 0x640000 | customer    | Customer SquashFS       |
| 0xe20000 | 0x010000 | private     |                         |
| 0xe30000 | 0x4a0000 | UDISK       | User Disk JFFS2         |

From DTS:

```
partitions {
    device_type = "partitions";

    env {
        device_type = "env";
        offset = <0x20>;
        size = <0x200>;
    };

    boot {
        device_type = "boot";
        offset = <0x220>;
        size = <0x1100>;
    };

    recovery {
        device_type = "recovery";
        offset = <0x1320>;
        size = <0x1100>;
    };

    rootfs {
        device_type = "rootfs";
        offset = <0x2420>;
        size = <0x1800>;
    };

    customer {
        device_type = "customer";
        offset = <0x3c20>;
        size = <0x3200>;
    };

    private {
        device_type = "private";
        offset = <0x6e20>;
        size = <0x80>;
    };

    UDISK {
        device_type = "UDISK";
        offset = <0x6ea0>;
        size = <0x00>;
    };
};
```

- Block size: 512
- Base: 0x5c000 (This is figured out by cross-referencing binwalk results and DTS. I'm not sure, is this static between FWs)

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
## Serial Console

- TTL 3.3v
- Baudrate 115200
- Input is disabled by default
  - uboot's `bootdelay=0`
  - `/sys/module/sunxi_uart/parameters/debug_mode` = `0`

To enable input:

1. Patch `bootdelay=5` in uboot's env and reflash the firmware
2. In uboot's console:
   1. `env set ly_boot_mode adb`
   2. `env save`
   3. `boot`
3. Create `/mnt/UDISK/app/httpd` and `chmod +x /mnt/UDISK/app/httpd`:

```bash
#!/bin/sh

echo "[+] httpd hijack"
echo "[+] enable debug uart"

echo 1 > /sys/module/sunxi_uart/parameters/debug_mode

/usr/sbin/httpd "$@"`
```

Restore `ly_boot_mode`:

1. `env set ly_boot_mode normal`
2. `env save`

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

## Device Tree

Decompiling the Device Tree (DTB)

```
dtc -I dtb -O dts <your DTB> -o <dts filename>
```

## U-Boot env

- The flash has two uboot env blobs: (0x060000, 0x080000)
- Size: 0x20000 (/etc/fw_env.config)

It has some weirdness since looks like the header has a redundant byte.
However, it's `0` for both blobs, and the CRC32 value includes the redundant byte.
So, this acts like a single uboot env (the header contains only the crc32 value).

```bash
$ xxd uboot-env.bin |head
00000000: 894a 8162 0065 6172 6c79 7072 696e 746b  .J.b.earlyprintk
00000010: 3d73 756e 7869 2d75 6172 742c 3078 3035  =sunxi-uart,0x05
00000020: 3030 3030 3030 0069 6e69 7463 616c 6c5f  000000.initcall_
00000030: 6465 6275 673d 3000 636f 6e73 6f6c 653d  debug=0.console=
```
## Misc

```bash
root@None:/# uname -a
Linux None 4.9.118 #511 PREEMPT Tue Apr 25 11:47:33 UTC 2023 armv7l GNU/Linux
root@None:/# cat /proc/cpuinfo
processor       : 0
model name      : ARMv7 Processor rev 5 (v7l)
BogoMIPS        : 48.00
Features        : half thumb fastmult vfp edsp neon vfpv3 tls vfpv4 idiva idivt vfpd32 lpae
CPU implementer : 0x41
CPU architecture: 7
CPU variant     : 0x0
CPU part        : 0xc07
CPU revision    : 5

Hardware        : sun8iw19
Revision        : 0000
Serial          : 0000000000000000

root@None:/# cat /proc/cmdline
earlyprintk=sunxi-uart,0x05000000 initcall_debug=0 console=ttyS0,115200 loglevel=3 root=/dev/mtdblock4 rootwait init=/pseudo_init rdinit=/rdinit partitions=env@mtdblock1:boot@mtdblock2:recovery@mtdblock3:rootfs@mtdblock4:customer@mtdblock5:private@mtdblock6:UDISK@mtdblock7 cma=4M coherent_pool=16K ion_carveout_list= led_mode=2 androidboot.hardware=sun8iw19p1 boot_type=3 androidboot.boot_type=3 gpt=1 uboot_message=(09/02/2022-18:42:57)
root@None:/# cat /proc/mtd
dev:    size   erasesize  name
mtd0: 00060000 00001000 "uboot"
mtd1: 00040000 00001000 "env"
mtd2: 00220000 00001000 "boot"
mtd3: 00220000 00001000 "recovery"
mtd4: 00300000 00001000 "rootfs"
mtd5: 00640000 00001000 "customer"
mtd6: 00010000 00001000 "private"
mtd7: 001d0000 00001000 "UDISK"

root@None:/# df -Th
Filesystem           Type            Size      Used Available Use% Mounted on
/dev/root            squashfs        3.0M      3.0M         0 100% /
devtmpfs             devtmpfs       58.5M         0     58.5M   0% /dev
tmpfs                tmpfs          60.6M      4.0K     60.6M   0% /tmp
/dev/by-name/customer
                     squashfs        6.0M      6.0M         0 100% /mnt/customer
/dev/by-name/UDISK   jffs2           1.8M   1020.0K    836.0K  55% /mnt/UDISK

```
