
//------------------------------------------------------------------------------- Receive commands from I²C Master -----------------------------------------------
void I2Ccommand(int recvflag)     
{
  byte command=0;
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
    
    if(recvflag == 6 && b==startbyte1user)
    {
     command = command | 1;
    }
    else if (recvflag == 4 && b==startbyte2users)
    {
     command = command | 2;
    }
    else if (errorflag == 0)
    {
      errorflag = errorflag | 1;
    }

  } while (errorflag>0 && Wire.available()>0);                                 // if errorflag>0 then empty buffer of corrupt data
  
  /*if(errorflag==1)                                                              // corrupt data received 
  {
    Serial.println("I2CcommandError");
    Serial.println(recvflag);
    Shutdown();                                                                // shut down motors and servos
    return;                                                                    // wait for valid data packet
  } */
  if(errorflag > 0)
  {
    Serial.println(errorflag);
    return;
  }
  
  
  //Serial.println("I2CcommandSuite");
  //----------------------------------------------------------------------------- valid data packet received ------------------------------
  
  if(command == 1)
  {
   //-----------------------------------------------------------------------------left motor speed-----------------------------------------
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
  
    //-----------------------------------------------------------------------------left motor speed-----------------------------------------
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
  
  
  //-----------------------------------------------------------------------------right motor speed-----------------------------------------
  
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
  
  //-----------------------------------------------------------------------------right motor speed-----------------------------------------
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
  //-----------------------------------------------------------------------------brake-----------------------------------------
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
  

  mode=0;                                                                      // breaks out of Shutdown mode when I²C command is given
  Motors();                                                                    // update brake, speed and direction of motors
  }
  
  
  if(command == 2)
  {
    //-----------------------------------------------------------------------------joystick camera mode-----------------------------------------
    b=Wire.read();                                                               // read joystick Camera mode from the buffer
  if(b>=0 && b<5)                                                               // if value is valid
  {
    angleConfiguration = b; 
  }
  else
  {
    errorflag = errorflag | 64;                                                 // incorrect pwmfreq given
  }
  //-----------------------------------------------------------------------------Pitch speed-----------------------------------------
  b=Wire.read();                                                               // read Pitch speed from the buffer
  if(b>=0 && b<256)                                                               // if value is valid
  {
    speedPitch = b;
  }
  else
  {
    errorflag = errorflag | 128;                                                 // incorrect pwmfreq given
  }
  //-----------------------------------------------------------------------------Yaw speed-----------------------------------------
   b=Wire.read();                                                               // read Yaw speed from the buffer
  if(b>=0 && b<256)                                                               // if value is valid
  {
    speedYaw = b;
  }
  else
  {
    errorflag = errorflag | 256;                                                 // incorrect pwmfreq given
  }
  
  c.speedPITCH = speedPitch * SBGC_SPEED_SCALE;   
  c.speedYAW = speedYaw * SBGC_SPEED_SCALE;
  
  if(angleConfiguration==1)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(-90);
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(-360);
  }
  
   if(angleConfiguration==2)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(-90);
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(360);
  }
  
   if(angleConfiguration==3)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(20);
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(-360);
  }
  
   if(angleConfiguration==4)
  {
  c.anglePITCH = SBGC_DEGREE_TO_ANGLE(20);
  c.angleYAW = SBGC_DEGREE_TO_ANGLE(360);
  }
    SBGC_sendCommand(SBGC_CMD_CONTROL, &c, sizeof(c));
    mode=0;
  }  
}




