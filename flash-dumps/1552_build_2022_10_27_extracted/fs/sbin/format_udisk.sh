#!/bin/sh

if [ $UPDATE_SAVE_BT_DATA == 'yes' ];then
	echo "ota save bt data"
	FILE_LIST=`find /mnt/UDISK/* ! -name "bt_conf.ini" ! -name "sc_db.db"`
	echo "FILE_LIST=$FILE_LIST"
	rm -fr $FILE_LIST

	sync
	exit 0
fi

function umount_udisk()
{
	echo "umount /mnt/UDISK"
	UDISK_MOUNT=`mount | grep /mnt/UDISK`
	trial=0
	while [ -n "$UDISK_MOUNT" ] && [ $trial -le 25 ]
	do 
		umount /mnt/UDISK
		sleep 0.2
		trial=$(($trial + 1 ))
		UDISK_MOUNT=`mount | grep /mnt/UDISK`
	done
	
	echo "wait /mnt/UDISK umount trial=$trial"
}

function do_format_jffs2()
{

	echo "formating $1 to jffs2 start"
	mkdir -p /tmp/jffs2.dir/tmp #mkfs.jffs2 need to point out a directory to copy to image file or local directory(./) defaultly
	mkfs.jffs2 -p -e 0x$(cat /proc/mtd | grep $(basename $1) | awk '{print $3}') -d /tmp/jffs2.dir -o /tmp/jffs2.img
	dd if=/tmp/jffs2.img of=$1
	rm -rf /tmp/jffs2.img /tmp/jffs2.dir
	echo "formating $1 to jffs2 end"
}

rm -fr /mnt/UDISK/*
sync
umount_udisk
do_format_jffs2 /dev/by-name/UDISK