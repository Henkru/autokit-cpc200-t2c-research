#!/bin/sh

if [ -z "$IPADDR" ];then
	export IPADDR=192.168.1.101
fi

if [ -z "$WIFIPATH" ];then
	export WIFIPATH=/etc/wifi
fi

if [ "$1" == "go" ];then
	sleep 1
	
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
		wpa_cli p2p_find &
		if [ $LY_LINK_TYPE == 'hicar' ];then
			ifconfig p2p-wlan0-0 192.168.43.1 netmask 255.255.255.0
		else
			ifconfig p2p-wlan0-0 $IPADDR netmask 255.255.255.0
		fi
		sed -i '/wlan0/c\interface p2p-wlan0-0' /tmp/udhcpd.conf
	fi
	
	udhcpd /tmp/udhcpd.conf &
fi

