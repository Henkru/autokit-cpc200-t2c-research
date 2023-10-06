#!/bin/sh

LY_BOOT_MODE=$1
LY_DEBUG_MODE=$2

if [ $LY_BOOT_MODE == 'adb' ];then
WORKDIR=/mnt/UDISK/app
else
WORKDIR=/mnt/customer/app
fi

export LD_LIBRARY_PATH=$WORKDIR:$LD_LIBRARY_PATH
export PATH=$WORKDIR:$PATH

if [ ${LY_BOOT_MODE} == 'update' ];then
echo "update mode exit blink.sh"
exit
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


echo 0 > /sys/devices/virtual/misc/ly_misc_dev/ly/bt_rst

echo "run gocsdk BT_NAME=$BT_NAME"
if [ $LY_DEBUG_MODE == 'yes' ];then
nice -n -16 $WORKDIR/gocsdk -T/dev/ttyS3 -N$BT_NAME &
else
nice -n -16 $WORKDIR/gocsdk -T/dev/ttyS3 -N$BT_NAME  > /dev/null 2>&1 &
fi

