import smbus
import time
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("X", help="Direction",type=int)
parser.add_argument("Y", help="Vitesse",type=int)
args = parser.parse_args()

# X=float(args.X)
# Y=float(args.Y)
X = args.X
Y = args.Y

X=-X

V=(100-abs(X))*(Y/100)+Y
W=(100-abs(Y))*(X/100)+X

R=int((V+W)/2)
L=int((V-W)/2)

if R>0:
	motorRForward = R *2+50
	motorRBackward = 0

elif R<0:
	motorRBackward = -(R *2)-50
	motorRForward = 0

else:
	motorRForward = 0
	motorRBackward = 0
	
if L>0:
	motorLForward = L *2 +50
	motorLBackward = 0

elif L<0:
	motorLBackward = -L*2-50
	motorLForward = 0

else:
	motorLForward = 0
	motorLBackward = 0
 
bus = smbus.SMBus(1)
address = 0x07

breakmotor = 0



# bus.write_byte(address,0x0F)
bus.write_i2c_block_data(address, 0x0F, [motorRForward, motorRBackward,motorLForward,motorLBackward,breakmotor])

# print motorLBackward, motorRForward, motorLForward, motorRBackward