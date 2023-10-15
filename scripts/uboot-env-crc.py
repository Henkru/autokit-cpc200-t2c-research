import binascii
import sys
import struct

data = open(sys.argv[1], 'rb').read()

env1 = data[:0x20000]
env2 = data[0x20000:]

header_size = 4
env1_header = env1[:header_size]
env2_header = env2[:header_size]
env1_data = env1[header_size:]
env2_data = env2[header_size:]

env1_crc = struct.unpack("<I", env1_header[:4])[0]
env2_crc = struct.unpack("<I", env2_header[:4])[0]

env1_crc_calc = binascii.crc32(env1_data) & 0xffffffff
env2_crc_calc = binascii.crc32(env2_data) & 0xffffffff

if env1_crc != env1_crc_calc:
    print("[+] env1 CRC mismatch")
print("Calculated: %s" % hex(env1_crc_calc))
print("Current: %s" % hex(env1_crc))
if env2_crc != env2_crc_calc:
    print("[+] env1 CRC mismatch")
print("Calculated: %s" % hex(env2_crc_calc))
print("Current: %s" % hex(env2_crc))
