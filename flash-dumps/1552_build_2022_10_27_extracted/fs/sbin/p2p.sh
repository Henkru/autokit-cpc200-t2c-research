#!/bin/sh

mkdir -p /var/wifi/misc
mkdir -p /var/run/hostapd

export WIFIPATH=/etc/wifi
MODULE_PATH=/lib/modules/4.9.118

if [ -z "$LY_LINK_TYPE" ];then
	export LY_LINK_TYPE=`fw_printenv -n ly_link_type`
fi

if [ ! -L /dev/random ];then
	rm -f /dev/random
	ln -s /dev/urandom /dev/random
fi

case "$1" in
	start)
	echo "Launch Wifi module p2p Mode..."
	
	mkdir -p /var/run/wpa_supplicant
	
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
	if [ "$WIFI_MODULE" == "aic8800" ];then
		if [ $LY_LINK_TYPE == 'hicar' ];then
			ifconfig wlan0 $IPADDR netmask $SUBNETMASK
		else
			ifconfig wlan0 192.168.43.1 netmask $SUBNETMASK
		fi
	else
		ifconfig wlan0 $IPADDR netmask $SUBNETMASK
	fi
	
	cp $WIFIPATH/p2p.conf /tmp/
	sed -i '/device_name=/c\device_name='$WIFI_NAME'' /tmp/p2p.conf
	wpa_supplicant -i wlan0 -c /tmp/p2p.conf -Dnl80211 &
	
	sleep 1
	
	if [ "$WIFI_MODULE" == "aic8800" ];then
		wpa_cli p2p_find
	fi
	
	wpa_cli p2p_group_add freq=5180
	
	if [ -f /tmp/udhcpd.conf ];then
		rm /tmp/udhcpd.conf
	fi
	
	if [ $LY_LINK_TYPE == 'hicar' ];then
		cp $WIFIPATH/udhcpd-hicar.conf /tmp/udhcpd.conf
	else
		cp $WIFIPATH/udhcpd-cp.conf /tmp/udhcpd.conf
	fi
	
	if [ "$WIFI_MODULE" == "aic8800" ];then
		status=`ifconfig -a | grep p2p-wlan0-0`
		trial=0
		while [ -z "$status" ] && [ $trial -le 20 ]
		do 
			sleep 0.2
			trial=$(($trial + 1 ))
			status=`ifconfig -a | grep p2p-wlan0-0`
		done

		if [ $trial -gt 20 ];then
			echo p2p-wlan0-0 not found
			exit -1
		fi

		if [ $LY_LINK_TYPE == 'hicar' ];then
			ifconfig p2p-wlan0-0 192.168.43.1 netmask 255.255.255.0
		else
			ifconfig p2p-wlan0-0 $IPADDR netmask 255.255.255.0
		fi
		sed -i '/wlan0/c\interface p2p-wlan0-0' /tmp/udhcpd.conf
	fi
	
	udhcpd /tmp/udhcpd.conf &
	
    ;;
    stop)
	echo " Kill all process of p2p Mode"
	killall p2p_mode.sh
	killall udhcpd
	killall wpa_supplicant
	ifconfig wlan0 down
	
	killall -9 p2p_mode.sh
	killall -9 udhcpd
	killall -9 wpa_supplicant
    ;;
    *)
	echo "Usage: $0 {start|stop|restart}"
	exit 1
esac

