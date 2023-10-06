#!/bin/sh

LY_BOOT_MODE=$1
WIFI_MODE=$2

if [ -z "$IPADDR" ];then
	export IPADDR=192.168.3.1
fi

if [ -z "$SUBNETMASK" ];then
	export SUBNETMASK=255.255.255.0
fi

WIFIPATH=/etc/wifi
MODULE_PATH=/lib/modules/4.9.118

# open wifi ap

echo "WIFI_MODULE=$WIFI_MODULE"
if [ "$WIFI_MODULE" == "8821cs" ];then
	$WORKDIR/blink.sh $LY_BOOT_MODE $LY_DEBUG_MODE &

	if [ -f /mnt/customer/modules/$WIFI_MODULE.ko ];then
		insmod /mnt/customer/modules/$WIFI_MODULE.ko rtw_vht_enable=2
	else
		insmod /lib/modules/4.9.118/$WIFI_MODULE.ko rtw_vht_enable=2
	fi

elif [ "$WIFI_MODULE" == "aic8800" ];then
	if [ -f /sys/devices/virtual/misc/ly_misc_dev/ly/app_firmware ];then
		if [ -d /mnt/customer/firmware ];then
			echo -n "/mnt/customer/firmware" > /sys/devices/virtual/misc/ly_misc_dev/ly/app_firmware
		fi
	fi
	
	if [ -f /mnt/customer/modules/aic8800_bsp.ko ];then
		insmod /mnt/customer/modules/aic8800_bsp.ko
	else
		insmod /lib/modules/4.9.118/aic8800_bsp.ko
	fi
	
	if [ -f /mnt/customer/modules/aic8800_fdrv.ko ];then
		insmod /mnt/customer/modules/aic8800_fdrv.ko
	else
		insmod /lib/modules/4.9.118/aic8800_fdrv.ko
	fi
	
	echo "run blink.sh"
	$WORKDIR/blink.sh ${LY_BOOT_MODE} ${LY_DEBUG_MODE} &
else
echo "not $WIFI_MODULE driver"
exit 0
fi

wlan0=`ifconfig -a | grep wlan0`
trial=0
while [ -z "$wlan0" ] && [ $trial -le 40 ]
do 
    sleep 0.2
    trial=$(($trial + 1 ))
    wlan0=`ifconfig -a | grep wlan0`
done

if [ $trial -gt 40 ];then
    echo wlan0 not found
    exit -1
fi

mkdir -p /var/wifi/misc
mkdir -p /var/run/hostapd/

rm -f /dev/random
ln -s /dev/urandom /dev/random
echo 1 > /proc/sys/net/ipv6/conf/wlan0/disable_ipv6
ifconfig wlan0 up
ifconfig wlan0 $IPADDR netmask $SUBNETMASK
ifconfig wlan0:0 101.200.208.6 netmask 255.255.255.255 up
sleep 1
echo " run lylinkui"
/tmp/lylink/tesla -s > /dev/null 2>&1 &
sleep 1
udhcpd $WORKDIR/udhcpd.conf
env LOCAL_IP_ADDRESS=$IPADDR $WORKDIR/lylinkapp &

echo 3 > /proc/sys/vm/drop_caches
