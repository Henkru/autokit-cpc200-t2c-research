import binascii
import sys

data = open(sys.argv[1], 'rb').read()

env1 = data[:0x20000]
env2 = data[0x20000:]

header_size = 4
env1_header = env1[:header_size]
env2_header = env2[:header_size]
env1_data = env1[header_size:]
env2_data = env2[header_size:]

env1_crc = binascii.crc32(env1_data) & 0xffffffff
env2_crc = binascii.crc32(env2_data) & 0xffffffff

print(hex(env1_crc))
print(hex(env2_crc))
