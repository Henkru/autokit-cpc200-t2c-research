#!/bin/sh

mkdir -p /var/wifi/misc
mkdir -p /var/run/hostapd

WIFIPATH=/etc/wifi
MODULE_PATH=/lib/modules/4.9.118

case "$1" in
  start)
  	echo "Launch Wifi module AP Mode ..."

	if [ "`lsmod|grep $WIFI_MODULE`" == "" ]; then
		echo "wifi modu1e is $WIFI_MODULE.ko"
		if [ "$WIFI_MODULE" == "8821cs" ];then
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
		elif [ "$WIFI_MODULE" == "ssv6x5x" ];then
			if [ -f /mnt/customer/modules/$WIFI_MODULE.ko ];then
				insmod /mnt/customer/modules/$WIFI_MODULE.ko stacfgpath=/etc/firmware/ssv6x5x-wifi.cfg
			else
				insmod /lib/modules/4.9.118/$WIFI_MODULE.ko stacfgpath=/etc/firmware/ssv6x5x-wifi.cfg
			fi
		else
			echo "not $WIFI_MODULE driver"
			exit 0
		fi
	fi

	wlan0=`ifconfig -a | grep wlan0`
	trial=0
	while [ -z "$wlan0" ] && [ $trial -le 10 ]
	do 
		sleep 0.5
		trial=$(($trial + 1 ))
		wlan0=`ifconfig -a | grep wlan0`
	done

	if [ $trial -gt 10 ];then
		echo wlan0 not found
		exit -1
	fi

	if [ -z "$IPADDR" ];then
		export IPADDR=192.168.1.101
	fi
	
	if [ -z "$SUBNETMASK" ];then
		export SUBNETMASK=255.255.255.0
	fi

	
	ifconfig wlan0 up
	ifconfig wlan0 $IPADDR netmask $SUBNETMASK
	sleep 0.2
	logwrapper udhcpd $WIFIPATH/udhcpd-cp.conf 

	echo "run $WIFIPATH/hostapd"
	cp $WIFIPATH/hostapd.conf /tmp/
	sed -i '/ssid=/c\ssid='$WIFI_NAME'' /tmp/hostapd.conf
	logwrapper hostapd -B /tmp/hostapd.conf                                

;;
  stop)
	echo " Kill all process of AP Mode"
	killall udhcpd
	killall hostapd
	ifconfig wlan0 0.0.0.0
	ifconfig wlan0 down
	killall -9 udhcpd
	killall -9 hostapd
;;
  restart)
	echo " restart AP Mode"
	

;;
  *)
	echo "Usage: $0 {start|stop|restart}"
	exit 1
esac

exit $?

