
//------------------------------------------------------------------------------- Receive commands from I²C Master -----------------------------------------------
void I2Ccommand(int recvflag)     
{

  byte boolForwardLeft;
  byte boolForwardRight;
  byte angleConfiguration;
  byte speedYaw;
  byte speedPitch;
  byte b;                                                                      // byte from buffer
  int i;      // integer from buffer

  errorflag =0;
  lastI2C = millis();
  do                                                                           // check for start byte
  {
  
    b=Wire.read();    // read a byte from the buffer

    //Changer flag to size of packet
    if(b!=startbyte) errorflag = errorflag | 1;                 // if byte does not equal startbyte or Master request incorrect number of bytes then generate error
    if(recvflag!=6) errorflag = errorflag | 64;

  } while (errorflag>0 && Wire.available()>0);                                 // if errorflag>0 then empty buffer of corrupt data
  
  if(errorflag==1)                                                              // corrupt data received 
  {
    Serial.println("I2CcommandError");
    Serial.println(recvflag);
    Shutdown();                                                                // shut down motors and servos
    return;                                                                    // wait for valid data packet
  } 
  if(errorflag > 1)
  {
    Serial.println(errorflag);
    return;
  }
  
  
  //Serial.println("I2CcommandSuite");
  //----------------------------------------------------------------------------- valid data packet received ------------------------------
  b=Wire.read();                                                               // read left motor speed (positive value) from the buffer
  if(b>=0 && b<256)                                                               // if value is valid  
  {

    if(b!=0)
    {
      lmspeed=b;
      boolForwardLeft=0;

    }
    else
    {
      boolForwardLeft = 1;
    }
    
  }
  else
  {
    errorflag = errorflag | 2;                                                 // incorrect value given
  }
  
  
   b=Wire.read();                                                               // read left motor speed (negative value) from the buffer
  if(b>=0 && b<256)                                                               // if value is valid
  {

    if(b!=0)
    {
        if(boolForwardLeft==1)
        {
          lmspeed=b;
          lmspeed=-lmspeed;   
        }

    }
    else{
          if(boolForwardLeft==1)
          {
          lmspeed=b;
          }
        }
  }
  else
  {
    errorflag = errorflag | 4;                                                 // incorrect pwmfreq given
  }
  
  
  
  
  b=Wire.read();                                                               // read right motor speed (positive value) from the buffer
  if(b>=0 && b<256)                                                               // if value is valid  
  {
    
    
    if(b!=0)
    {
      rmspeed=b;
      boolForwardRight=0;
      //Serial.println(rmspeed);
    }
    else
    {
      boolForwardRight = 1;
    }
    
  }
  else
  {
    errorflag = errorflag | 8;                                                 // incorrect value given
  }
  
  
   b=Wire.read();                                                               // read right motor speed (negative value)from the buffer
  if(b>=0 && b<256)                                                               // if value is valid  
  {

    if(b!=0)
    {
        if(boolForwardRight==1)
        {
          rmspeed=b;
          rmspeed=-rmspeed; 
          //Serial.println(rmspeed);   
        }

    }
    else{
          if(boolForwardRight==1)
          {
          rmspeed =b;
          }
        }
  }
  else
  {
    errorflag = errorflag | 16;                                                 // incorrect value given
  }
  
 b=Wire.read();                                                               // read brake value from the buffer
  if(b==0 || b==1)                                                               // if value is valid 
  {

   if(b==1)
   {
     lmbrake =1;
     rmbrake=1;
   }
   else
   {
     lmbrake=0;
     rmbrake=0;
   }
  }
  else
  {
    errorflag = errorflag | 32;                                                 // incorrect value given
  }
  
   b=Wire.read();                                                               // read joystick Camera mode from the buffer
  if(b>=0 && b<5)                                                               // if value is valid
  {
    angleConfiguration = b; 
  }
  else
  {
    errorflag = errorflag | 64;                                                 // incorrect pwmfreq given
  }

  b=Wire.read();                                                               // read Pitch speed from the buffer
  if(b>=0 && b<256)                                                               // if value is valid
  {
    speedPitch = b;
  }
  else
  {
    errorflag = errorflag | 128;                                                 // incorrect pwmfreq given
  }
  
   b=Wire.read();                                                               // read Yaw speed from the buffer
  if(b>=0 && b<256)                                                               // if value is valid
  {
    speedYaw = b;
  }
  else
  {
    errorflag = errorflag | 256;                                                 // incorrect pwmfreq given
  }
  
  if(angleConfiguration==1)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(-20);
  c.speedPITCH = speedPitch * SBGC_SPEED_SCALE;
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(-360);
  c.speedYAW = speedYaw * SBGC_SPEED_SCALE;
  SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
  }
  
   if(angleConfiguration==2)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(-20);
  c.speedPITCH = speedPitch * SBGC_SPEED_SCALE;
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(360);
  c.speedYAW = speedYaw * SBGC_SPEED_SCALE;
  SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
  }
  
   if(angleConfiguration==3)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(90);
  c.speedPITCH = speedPitch * SBGC_SPEED_SCALE;
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(-360);
  c.speedYAW = speedYaw * SBGC_SPEED_SCALE;
  SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
  }
  
   if(angleConfiguration==4)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(90);
  c.speedPITCH = speedPitch * SBGC_SPEED_SCALE;
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(360);
  c.speedYAW = speedYaw * SBGC_SPEED_SCALE;
  SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
  }

  mode=0;                                                                      // breaks out of Shutdown mode when I²C command is given
  Motors();                                                                    // update brake, speed and direction of motors
                                                              
}




