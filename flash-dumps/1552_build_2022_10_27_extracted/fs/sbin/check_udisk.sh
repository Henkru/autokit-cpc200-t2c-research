#!/bin/sh


#mkfs_jffs2() <device in /dev/by-name>
mkfs_jffs2() {
	! [ -x /usr/sbin/mkfs.jffs2 ] \
		&& ! [ -x /sbin/mkfs.jffs2 ] \
		&& echo "Not Found /usr/sbin/mkfs.jffs2 or /sbin/mkfs.jffs2" \
		&& return 1

	# format to jffs2
	local erase_block=$(/bin/cat /proc/mtd \
		| /bin/grep "$(basename $1)" \
		| /usr/bin/awk '{print $3}')
	/bin/mkdir -p /tmp/jffs2.dir/tmp
	mkfs.jffs2 -p -e 0x${erase_block} -d /tmp/jffs2.dir \
		-o /tmp/jffs2.img >/dev/null || return 1
	/bin/dd if=/tmp/jffs2.img of=$1 || return 1
	/bin/rm -rf /tmp/jffs2.img /tmp/jffs2.dir
	return 0
}

mount_filesystem()
{
	local fs_src="$1"
	local fs_mntpt="$2"
	# mount filesystem
	if [ -e "$fs_src" -a -d "$fs_mntpt" ]; then
		[ -L "$fs_src" ] && blk_dev=$(readlink "$fs_src")
		case "$blk_dev" in
			/dev/mtdblock*)
				mount -t jffs2 "$fs_src" "$fs_mntpt" 2>/dev/null
				if [ "$?" -ne "0" ]; then
					mkfs_jffs2 "$fs_src"
					mount -t jffs2 "$fs_src" "$fs_mntpt" 2>/dev/null
				fi
				;;
			*)
				/usr/sbin/fsck.ext4 -y "$fs_src" &>/dev/null
				mount -t ext4 "$fs_src" "$fs_mntpt" 2>/dev/null
				if [ "$?" -ne "0" ]; then
					mkfs.ext4 -m 0 "$fs_src" >/dev/null
					mount -t ext4 "$fs_src" "$fs_mntpt" 2>/dev/null
				fi
				;;
		esac

		# restore /mnt file contexts
		if [ -f /sbin/restorecon ]; then
			/sbin/restorecon -R /mnt
		fi
	fi
}


UDISK_MOUNT=`mount | grep /mnt/UDISK`
if [ -z "$UDISK_MOUNT" ];then
	echo "/mnt/UDISK no mount"
	mount_filesystem "/dev/by-name/UDISK" "/mnt/UDISK"
else
	echo "/mnt/UDISK is mount ok"
fi

