#!/bin/sh

#rm -fr /mnt/UDISK/*

BACKUP=/tmp/UDISK_bak
mkdir $BACKUP
cd /mnt/UDISK
cp bt_conf.ini sc_db.db lycfg.txt $BACKUP/
rm -rf *
cp $BACKUP/* .
sync
