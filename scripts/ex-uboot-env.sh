#!/bin/bash

ENV_START=0x060000
ENV_SIZE=0x40000

dd if="$1" of=uboot-env.bin bs=1 skip=$(($ENV_START)) count=$(($ENV_SIZE))
