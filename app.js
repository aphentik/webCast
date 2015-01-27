var http = require('http');
var fs = require('fs');
var nconf = require('nconf');
    nconf.use('file', { file: './config.json' }); 
var express = require('express');
var app = express();
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'ejs');
var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: false }));
// Server variables
var port= 3000;
var server = app.listen(port);
var exec = require('child_process').exec;
// i2C variables
var i2c = require('i2c');
var address = 0x07;
var TRex = new i2c(address, {device: '/dev/i2c-1',debug: false});
//Wild Thumper command variables
var offset = 0;
var coeff=1;
// Set "Public" as root folder for static content
app.use(express.static(__dirname + '/public'));
//Load settings 
nconf.load(function (err) {
if (err) {
  console.error(err.message);
  return;
}
console.log('Configuration loaded successfully.');
});
var control_md=nconf.get('control_mode');
var acc_md=nconf.get('acc_mode');

// Socket.io loading
var io = require('socket.io').listen(server);



//============== ROUTES ============================================================
//index
app.get('/', function(req, res) {
    //res.writeHead(200, {'Content-Type': 'text/html'});

    res.render('index.ejs',{ 
    control_mode: control_md,
    acc_mode: acc_md
  }); 
});

//settings page
app.get('/settings', function(req, res) {
    //res.writeHead(200, {'Content-Type': 'text/html'});

    var control_md=nconf.get('control_mode');
    var acc_md=nconf.get('acc_mode');
    res.render('settings.ejs',{ 
        control_mode: control_md,
        acc_mode: acc_md
  }); 
});
//editsettings (post method)
app.post('/editsettings', function(req,res){

    control_md= req.body.control_mode;
    acc_md= req.body.acc_camera_mode;
    nconf.set('acc_mode', acc_md);
    nconf.set('control_mode', control_md);
    console.log('Controle mode: '+control_md);
    console.log('Accelerometer camea control: '+acc_md);
    //save settings
    nconf.save(function (err) {
        if (err) {
            console.error(err.message);
        return;
        }
        console.log('Configuration saved successfully.');
    });
    res.redirect('/');
});


// =================== SOCKET.IO ===================================================
// Lors de la connection d'un client 
io.sockets.on('connection', function (socket) {
    console.log('New client connected: '+ socket.handshake.address);


    socket.on('coordinateCam', function(data){ 
        var DXR = data.DXR;
        var DYR = data.DYR;

        // =================== CAMERA MOVEMENT ===============================================
        var speedYaw,
            speedPitch,
            angleConfiguration;

        if (DXR == 0 && DYR == 0) 
            {
                speedPitch = 0;
                speedYaw = 0;
            } else{
                speedYaw    = parseInt(3*DXR/5);
                speedPitch  = parseInt(3*DYR/5);
                if (DXR<0 && DYR<0) {
                    angleConfiguration = 1;
                }else if (DXR>0 && DYR<0) {
                    angleConfiguration = 2;
                }else if (DXR<0 && DYR>0) {
                    angleConfiguration = 3;
                }else if (DXR>0 && DYR>0) {
                    angleConfiguration = 4;
                }
            };

        // Sending command via i2c
        TRex.writeBytes(0x0E, [angleConfiguration, speedPitch, speedYaw], function(err) { if(err){console.log("i2c Error: "+ err);} });       

    });

    // Quand le serveur reçoit un signal de type "Coordinate" du client    
    socket.on('coordinateRob', function(data){
        // Récupération des coordonnées 
        var DXL = data.DXL;
        var DYL = data.DYL;
        var DXR = data.DXR;
        var DYR = data.DYR ;
        //console.log('LEFT Coordinate: X = ' + DXL + '; Y = '+DYL);
        //console.log('RIGHT Coordinate: X = ' + DXR + '; Y = '+DYR);

        // Wild Thumper control code
        var motorRForward,
            motorRBackward,
            motorLForward,
            motorLBackward,
            breakmotor;
        
// =================  MOBILE BASE MOVEMENT =====================================        
        // Control mode choice
        if(control_md=="polar"){

            // POLAR MODE
            var R=0,
                L=0;
            //  Passage en coordonnées Polaires
            var radius = Math.sqrt(DXL*DXL + DYL*DYL);
            var theta = 2* Math.atan(DYL/(DXL+ radius));
            var pi = Math.PI;

            if(-pi<=theta && theta<-(pi/2))
            {
                R = -radius;
                L = -radius*(2*theta/pi + 2);
            }
            else if(-pi/2<=theta && theta<0)
            {
                R = radius*(2*theta/pi);
                L = -radius;
            }
            else if(0<=theta && theta<pi/2)
            {
                R = radius*2*theta/pi;
                L = radius;
            }
            else if(pi/2<=theta && theta<=pi)
            {
                R = radius;
                L = radius* (-2*theta/pi + 2);
            }

            if(R>0){
            R=parseInt(1/75000*Math.pow(R,3)+1/500*Math.pow(R,2)+1/15*R)
                motorRForward = R *coeff +offset;
                motorRBackward = 0;
            }else if(R<0){
                R=-parseInt(1/75000*Math.pow(-R,3)+1/500*Math.pow(-R,2)+1/15*-R)
                motorRBackward = -(R *coeff)+ offset;
                motorRForward = 0;
            }else{
                motorRForward = 0;
                motorRBackward = 0;
            }  
            if(L>0){
            L=parseInt(1/75000*Math.pow(L,3)+1/500*Math.pow(L,2)+1/15*L)
                motorLForward = L *coeff + offset;
                motorLBackward = 0;
            }else if(L<0) {
            L=-parseInt(1/75000*Math.pow(-L,3)+1/500*Math.pow(-L,2)+1/15*-L)            
                motorLBackward = -L*coeff+ offset;
                motorLForward = 0;
            }else{
                motorLForward = 0;
                motorLBackward = 0;
            };
        }else if(control_md == "tank"){

            // TANK MODE
            var V=(200-Math.abs(DXL))*(DYL/200)+DYL;
            var W=(200-Math.abs(DYL))*(DXL/200)+DXL;
            var R= parseInt((V+W)/2);
            var L=parseInt((V-W)/2);
            if(R>0){
                motorRForward = R *coeff +offset;
                motorRBackward = 0;
            }else if(R<0){
                motorRBackward = -(R *coeff)+ offset;
                motorRForward = 0;
            }else{
                motorRForward = 0;
                motorRBackward = 0;
            }
            if(L>0){
                motorLForward = L *coeff + offset;
                motorLBackward = 0;
            }else if(L<0) {
                motorLBackward = -L*coeff+ offset;
                motorLForward = 0;
            }else{
                motorLForward = 0;
                motorLBackward = 0;
            };
        }
        breakmotor = 0;
        //console.log('L : '+L+ ' R :'+R+' radius : '+ radius + ' theta: '+ theta + ' LF='+ motorLForward +' LB='+motorLBackward+' RF='+ motorRForward+' RB='+motorRBackward);
        TRex.writeBytes(0x0F, [motorLForward, motorLBackward,motorRForward,motorRBackward,breakmotor], function(err) { if(err){console.log("i2c Error: "+ err);} });
        //TRex.writeBytes(0x0F, [motorLForward, motorLBackward,motorRForward,motorRBackward,breakmotor,angleConfiguration, speedPitch, speedYaw], function(err) { if(err){console.log("i2c Error: "+ err);} });       
    });
});

// Read Battery Level 
// setInterval(function(){
//     TRex.readBytes(0x0F, 2, function(err, res) {
         // result contains a buffer of bytes
//         if(err){
//             console.log("i2c Read battery Error: "+ err);
//         };   
//         console.log(res);  //"Read battery result:"+ 
//     }); 
// }, 10 *1000);

console.log('Server Listening on port '+port);
console.log('Cast Control Interface: http://192.168.10.1:3000');
console.log('Camera Settings Interface: http://192.168.10.1:8080');
console.log('ENJOY YOUR RIDE ;) ');