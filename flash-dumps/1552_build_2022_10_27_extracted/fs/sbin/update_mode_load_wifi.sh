#!/bin/sh

if [ -z "$IPADDR" ];then
	export IPADDR=192.168.1.101
fi

if [ -z "$SUBNETMASK" ];then
	export SUBNETMASK=255.255.255.0
fi

echo "update mode load wifi.sh "

LY_LINK_TYPE=`fw_printenv -n ly_link_type`

echo "LY_LINK_TYPE=$LY_LINK_TYPE"

WIFIPATH=/etc/wifi
MODULE_PATH=/lib/modules/4.9.118

echo "WIFI_MODULE=$WIFI_MODULE"
if [ "$WIFI_MODULE" == "8821cs" ];then
insmod ${MODULE_PATH}/$WIFI_MODULE.ko rtw_vht_enable=2
elif [ "$WIFI_MODULE" == "aic8800" ];then
insmod ${MODULE_PATH}/aic8800_bsp.ko
insmod ${MODULE_PATH}/aic8800_fdrv.ko
else
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

rm -f /dev/random
ln -s /dev/urandom /dev/random
ifconfig wlan0 up


if [ $LY_LINK_TYPE == 'hicar' ];then
	echo "run $WIFIPATH/wpa_supplicant"
	mkdir -p /var/run/wpa_supplicant
		
	if [ "$WIFI_MODULE" == "aic8800" ];then
		ifconfig wlan0 192.168.1.101 netmask 255.255.255.0
		
		cp $WIFIPATH/p2p.conf /tmp/
		sed -i '/device_name=/c\device_name='$WIFI_NAME'' /tmp/p2p.conf
		wpa_supplicant -i wlan0 -c /tmp/p2p.conf -Dnl80211 &
		
		sleep 2
		
		wpa_cli p2p_find &

		wpa_cli p2p_group_add freq=5180
		
		ifconfig p2p-wlan0-0 192.168.43.1 netmask 255.255.255.0
		
		cp $WIFIPATH/udhcpd-hicar.conf /tmp/udhcpd.conf
		sed -i '/wlan0/c\interface p2p-wlan0-0' /tmp/udhcpd.conf
		udhcpd /tmp/udhcpd.conf
		
		wpa_cli wps_pbc
		
		while [ true == true ]
		do
			sleep 100
			wpa_cli wps_pbc
		done
	else
		ifconfig wlan0 192.168.43.1 netmask 255.255.255.0
		
		cp $WIFIPATH/p2p.conf /tmp/
		sed -i '/device_name=/c\device_name='$WIFI_NAME'' /tmp/p2p.conf
		wpa_supplicant -i wlan0 -c /tmp/p2p.conf -Dnl80211 &
		
		sleep 2
		
		udhcpd $WIFIPATH/udhcpd-hicar.conf
		
		wpa_cli -iwlan0 p2p_group_add freq=5180
		
		wpa_cli -iwlan0 wps_pbc
		
		while [ true == true ]
		do
			sleep 100
			wpa_cli -iwlan0 wps_pbc
		done
	fi
else
	ifconfig wlan0 $IPADDR netmask $SUBNETMASK
	
	#udhcpd $WIFIPATH/udhcpd-cp.conf
	cp $WIFIPATH/udhcpd-cp.conf /tmp/udhcpd-cp.conf
	sed -i '/dns/d' /tmp/udhcpd-cp.conf
	sed -i '/router/d' /tmp/udhcpd-cp.conf
	sed -i '/subnet/iopt router 0.0.0.0' /tmp/udhcpd-cp.conf
	udhcpd /tmp/udhcpd-cp.conf
	
	echo "run $WIFIPATH/hostapd"
	cp $WIFIPATH/hostapd.conf /tmp/
	if [ ! -z "$WIFI_NAME_UDP" ];then
		sed -i '/ssid=/c\ssid='$WIFI_NAME_UDP'' /tmp/hostapd.conf
	else
		sed -i '/ssid=/c\ssid='$WIFI_NAME'' /tmp/hostapd.conf
	fi
	hostapd -B /tmp/hostapd.conf
fi



