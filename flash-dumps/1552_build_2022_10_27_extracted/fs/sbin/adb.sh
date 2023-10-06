#!/bin/sh

killall adbd
setusbconfig none
setusbconfig adb
adbd &

