#!/bin/sh
echo "killall app service"
SERVICE_LIST=`find /mnt/customer/app -maxdepth 2 -type f ! -name "update" -type f ! -name "*.jpg*" -type f ! -name "*.so*" -type f ! -name "*.png" -type f ! -name "*.ttf" -type f ! -name "*.json" -type f ! -name "*.conf" | sed 's#.*/##'`
echo "SERVICE_LIST=$SERVICE_LIST"
killall -9 $SERVICE_LIST
exit 0