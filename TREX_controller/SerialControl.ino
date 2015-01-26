/******************************************************************************
	This is example sketch for Arduino.
	Shows how to control SimpleBGC-driven gimbal via Serial API.
	API specs are available at http://www.basecamelectronics.com/

	Demo:  control camera angles by Serial API direct control and by
	emulating various RC input methods;

	Arduino hardware:
	- analog joystick on the pins A1, A2  (connect GND, +5V to the side outputs of its potentiometers)

	Gimbal settings:
	- RC control in SPEED mode, RC signal should come from active RC source
	- RC SPEED is set to about 30..100

	Copyright (c) 2014 Aleksey Moskalenko
*******************************************************************************/





/*****************************************************************************/



void SerialControl() {
	SBGC_cmd_control_data c = { 0, 0, 0, 0, 0, 0, 0 };


	// Move camera to initial position (all angles are zero)
	// Set speed 30 degree/sec
	c.mode = SBGC_CONTROL_MODE_ANGLE;
	c.speedROLL = c.speedPITCH = c.speedYAW = 30 * SBGC_SPEED_SCALE;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(3000);

	
	
	blink_led(1);
	/////////////////// Demo 1. PITCH and YAW gimbal by 40 and 30 degrees both sides and return back.
	// Actual speed depends on PID setting.
	// Whait 5 sec to finish
	c.mode = SBGC_CONTROL_MODE_ANGLE;
        c.angleROLL = SBGC_DEGREE_TO_ANGLE(10);
	c.anglePITCH = SBGC_DEGREE_TO_ANGLE(40);
	//c.angleYAW = SBGC_DEGREE_TO_ANGLE(30);
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(4000);
	c.anglePITCH = SBGC_DEGREE_TO_ANGLE(-40);
        c.speedPITCH = 50 * SBGC_SPEED_SCALE;
	//c.angleYAW = SBGC_DEGREE_TO_ANGLE(-30);
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(8000);
	// .. and back
	c.anglePITCH = 0;
        c.speedPITCH = 10 * SBGC_SPEED_SCALE;
	//c.angleYAW = 0;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(4000);


	/*blink_led(2);
	/////////////////// Demo 2. Pitch gimbal down with constant speed 10 degree/sec
	// by 50 degree (it takes 5 sec)
	// (this is simplified version of speed control. To prevent jerks, you should
	// add acceleration and de-acceleration phase)
	c.mode = SBGC_CONTROL_MODE_SPEED;
	c.speedPITCH = 10 * SBGC_SPEED_SCALE;
	c.speedROLL = 0;
	//c.speedYAW = 0;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(5000);
	// Stop
	c.speedPITCH = 0;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(1000);
	// .. and back
	c.speedPITCH = -10 * SBGC_SPEED_SCALE;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(5000);
	// Stop
	c.speedPITCH = 0;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(1000);*/


	/*blink_led(3);
	///////////// Demo3: Return control back to RC for 5 seconds
	c.mode = SBGC_CONTROL_MODE_NO;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(5000);*/



	/*blink_led(4);
	//////////// Demo 4. More complicated example: Pitch gimbal by 40 degrees
	// with the full control of speed and angle.
	//  - send control command with the fixed frame rate
	//  - angle is calculated by the integration of the speed
	float speed = 0, angle = 0;
	c.mode = SBGC_CONTROL_MODE_SPEED_ANGLE;
	// acceleration phase
	while(angle < 20.0f) {
		speed+= 0.5f;
		c.speedPITCH = speed * SBGC_SPEED_SCALE;
		angle+= speed * SBGC_CMD_DELAY / 1000.0f;  // degree/sec -> degree/ms
		c.anglePITCH = SBGC_DEGREE_TO_ANGLE(angle);
		SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
		delay(SBGC_CMD_DELAY);
	}
	// de-acceleration phase
	while(angle < 40.0f && speed > 0.0f) {
		speed-= 0.5f;
		c.speedPITCH = speed * SBGC_SPEED_SCALE;
		angle+= speed * SBGC_CMD_DELAY / 1000.0f;
		c.anglePITCH = SBGC_DEGREE_TO_ANGLE(angle);
		SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
		delay(SBGC_CMD_DELAY);
	}*/


	
	/*blink_led(5);
	/////////////// Demo5: Emulate RC stick input on PITCH, reading it from analog input wher joystick is connected
	c.mode = SBGC_CONTROL_MODE_RC;
	c.angleROLL = c.angleYAW = 0;
	c.anglePITCH = 800 - (1024/2); // neutral point is 0
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
	delay(5000);
        c.anglePITCH = 200 - (1024/2); // neutral point is 0
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
        delay(5000);

	// Turn off serial control
	c.mode = SBGC_CONTROL_MODE_NO;
	SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));*/



	/*blink_led(6);
	//////////// Demo6: Read A1, A2 where analog joystick is connected,
	// and send their values to the API Virtual Channels 1 and 2.
	// You can map this channels to any function you like, in the GUI
	// (firmware v.2.43 (32bit) or above is required)
	SBGC_cmd_api_virt_ch_control cmd;
	// Mark all channels as 'no signal'
	for(uint8_t i=0; i<SBGC_API_VIRT_NUM_CHANNELS; i++) {
		cmd.data[i] = SBGC_RC_UNDEF;
	}

	for(int i=0; i<500; i++) {
		cmd.data[0] = (int16_t)analogRead(1) - (1024/2); // neutral point should be 0
		cmd.data[1] = (int16_t)analogRead(2) - (1024/2);
		SBGC_sendCommand(SBGC_CMD_API_VIRT_CH_CONTROL, &cmd, sizeof(cmd));
		delay(20);  // 20*500  = 10 seconds to finish test
	}
	// Set 'NO SIGNAL' state
	cmd.data[0] = SBGC_RC_UNDEF;
	cmd.data[1] = SBGC_RC_UNDEF;
	SBGC_sendCommand(SBGC_CMD_API_VIRT_CH_CONTROL, &cmd, sizeof(cmd));

	delay(1000);*/
}
