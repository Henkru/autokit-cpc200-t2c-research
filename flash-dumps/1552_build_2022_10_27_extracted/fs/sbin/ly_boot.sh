#!/bin/sh

echo "ly_boot"

if [ -z "$LY_BOOT_MODE" ];then
	export LY_BOOT_MODE=`fw_printenv -n ly_boot_mode=`
fi

update_status=false
boot_part=`fw_printenv -n boot_partition=`
if [ $boot_part == 'recovery' ];then
	echo "boot for recovery"
	update_status=true
fi

if [ -f /mnt/UDISK/update_flag ];then
	echo "boot for /mnt/UDISK/update_flag"
	update_status=true
fi

if [ $update_status == 'true' ];then
	if [ $LY_BOOT_MODE != 'update' ];then
		fw_setenv ly_boot_mode update
		export LY_BOOT_MODE=`fw_printenv -n ly_boot_mode=`
		echo "SET BOOT_MODE=$LY_BOOT_MODE"
	fi
fi

echo "BOOT_MODE=$LY_BOOT_MODE"

if [ -z "$LY_DEBUG_MODE" ];then
	export LY_DEBUG_MODE=`fw_printenv -n ly_debug_mode=`
fi
echo "DEBUG_MODE=$LY_DEBUG_MODE"



mkdir -p /var/run 
mknod /dev/iap c 180 192

#if [ -L /dev/by-name/customer ];then
#	CUSTOMER=`mount | grep /mnt/customer`
#	trial=0
#	while [ -z "$CUSTOMER" ] && [ $trial -le 25 ]
#	do 
#		sleep 0.1
#		trial=$(($trial + 1 ))
#		CUSTOMER=`mount | grep /mnt/customer`
#	done
#
#	if [ $trial -gt 25 ];then
#		echo /mnt/customer not found
#	fi
#
#	echo "wait customer trial=$trial"
#fi


if [ $LY_BOOT_MODE == 'adb' ];then

	echo 1 > /sys/module/sunxi_uart/parameters/debug_mode

	WORKDIR=/mnt/UDISK/app

	echo "debug mode "

	if [ -e /bin/setusbconfig ];then
		/bin/setusbconfig none
	fi	

	UDISK=`mount | grep /mnt/UDISK`
	trial=0
	while [ -z "$UDISK" ] && [ $trial -le 25 ]
	do 
		sleep 0.2
		trial=$(($trial + 1 ))
		UDISK=`mount | grep /mnt/UDISK`
	done

	if [ $trial -gt 25 ];then
		echo /mnt/UDISK not found
	fi

	echo "wait udisk trial=$trial"

elif [ $LY_BOOT_MODE == 'update' ];then
	echo "ly update mode "
	
	if [ $LY_SDCARD_ENABLE == '1' ];then
		udev.sh &
	fi
	
	echo 1 > /sys/devices/virtual/misc/ly_misc_dev/ly/ly_boot_mode
	
	touch /tmp/update_flag
	
	umount /mnt/customer
	
	/sbin/update &
	httpd -c /usr/ota/httpd.conf
	
	fw_setenv swu_mode 
	
	if [ -L /dev/by-name/backup ];then
		/bin/mkdir -p /tmp/backup
		/bin/mount /dev/by-name/backup /mnt/backup >/dev/null || {
			rm -rf /tmp/backup
			update_mode_load_wifi.sh &
			return
		}
		
		if [ -L /dev/by-name/backup ];then
			backup=`mount | grep /mnt/backup`
			trial=0
			while [ -z "$backup" ] && [ $trial -le 25 ]
			do 
				sleep 0.1
				trial=$(($trial + 1 ))
				backup=`mount | grep /mnt/backup`
			done

			if [ $trial -gt 25 ];then
				echo /mnt/backup not found
				update_mode_load_wifi.sh &
				return
			fi

			echo "wait backup trial=$trial"
		fi
		
		export WORKDIR=/mnt/backup/app
		export LD_LIBRARY_PATH=$WORKDIR:$LD_LIBRARY_PATH
		export PATH=$WORKDIR:$PATH

		$WORKDIR/lyLink.sh ${LY_BOOT_MODE} ${LY_DEBUG_MODE} &
		return
	fi
	
	update_mode_load_wifi.sh &

	exit 0
else

	WORKDIR=/mnt/customer/app

fi

export LD_LIBRARY_PATH=$WORKDIR:$LD_LIBRARY_PATH
export PATH=$WORKDIR:$PATH

$WORKDIR/lyLink.sh ${LY_BOOT_MODE} ${LY_DEBUG_MODE} &


/sbin/update &
httpd -c /usr/ota/httpd.conf

if [ $LY_SDCARD_ENABLE == '1' ];then
	sleep 5
	udev.sh &
fi
