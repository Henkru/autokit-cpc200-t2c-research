#!/bin/sh
LY_BOOT_MODE=$1
LY_DEBUG_MODE=$2

if [ $LY_BOOT_MODE == 'adb' ];then
export WORKDIR=/mnt/UDISK/app
else
export WORKDIR=/mnt/customer/app
fi

LY_LINK_TYPE=`fw_printenv -n ly_link_type`

echo "LY_LINK_TYPE=$LY_LINK_TYPE"


mkdir -p /tmp/bin

echo "WORKDIR=$WORKDIR"
export LD_LIBRARY_PATH=/tmp/lylink/lib:/tmp/lylink/eyesee-mpp:$WORKDIR:/usr/lib/eyesee-mpp
export PATH=/tmp/bin:$WORKDIR:$PATH
export LY_PLATFORM=v831

if [ ${LY_BOOT_MODE} == 'update' ];then

echo "ly update mode"


else

echo "5242880">/proc/sys/net/core/rmem_max
echo "5242880">/proc/sys/net/core/wmem_max

ln -s /dev/net/tun /dev/tun

# lo up
ifconfig lo up

echo "setusbconfig"
if [ -e /bin/setusbconfig ];then
	/bin/setusbconfig none
fi

mkdir -p /tmp/lylink/lib
cp -r $WORKDIR/www /tmp/lylink/
cp -r /mnt/customer/eyesee-mpp /tmp/lylink/
cp -r $WORKDIR/ui/* /tmp/lylink/lib/
cp $WORKDIR/lylinkui /tmp/lylink/tesla
cp -r $WORKDIR/format_udisk.sh /tmp/bin/
chmod -R 755 /tmp/bin/format_udisk.sh

$WORKDIR/lyLoadModule.sh $LY_BOOT_MODE ap

$WORKDIR/lyUpdate.sh $WORKDIR

echo 3 > /proc/sys/vm/drop_caches

fi
