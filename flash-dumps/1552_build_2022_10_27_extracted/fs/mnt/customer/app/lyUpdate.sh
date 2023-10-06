#!/bin/sh
WORKPATH=$1
update_service=`ps | grep /sbin/update`
while [ -z "$update_service" ]
do
	sleep 0.5
	update_service=`ps | grep /sbin/update`
done
if [ -f $WORKPATH/update ];then
echo "kill /sbin/update"
killall -9 update
echo 0 > /sys/devices/virtual/misc/ly_misc_dev/ly/update
echo "start $WORKPATH/update"
rm -fr /tmp/update
cp $WORKPATH/update /tmp/update
/tmp/update &
fi


d0=$WORKPATH/../ota
#if [ ! -f $d0/httpd.conf ]; then
#	exit 0
#fi

killall -9 httpd

d1=/usr/ota/www
d2=$d0/www
d3=/tmp/ota
d4=$d3/www

mkdir -p $d3 && echo -en "H:$d4\nE404:index.html\n" >  $d3/httpd.conf

mkdir $d4 && cd $d4
ln -s $d1/index.html .
if [ -f $d2/index.html ]; then
	ln -sf $d2/index.html .
fi

mkdir $d4/cgi-bin && cd $d4/cgi-bin
ln -s $d1/cgi-bin/* .
if [ -d $d2/cgi-bin ]; then
	cp -f $d2/cgi-bin/* .
fi

for a in css js lan
do
	mkdir $d4/$a && cd $d4/$a
	ln -s $d1/$a/* .
	if [ -d $d2/$a ]; then
		ln -sf $d2/$a/* .
	fi
done

httpd -p $IPADDR:80 -c $d3/httpd.conf
