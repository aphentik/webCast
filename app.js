var http = require('http');
var fs = require('fs');
var nconf = require('nconf');
  nconf.use('file', { file: './config.json' });

// NEVER use a Sync function except at start-up!
//var index = fs.readFileSync(__dirname + '/index.html');
var express = require('express');
var app = express();
    app.engine('html', require('ejs').renderFile);
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

//Load configuration  
nconf.load(function (err) {
if (err) {
  console.error(err.message);
  return;
}
console.log('Configuration loaded successfully.');
});

// Set "Public" as root folder for static content
app.use(express.static(__dirname + '/public'));  

// Socket.io loading
var io = require('socket.io').listen(server);

// ROUTES
app.get('/', function(req, res) {
    //res.writeHead(200, {'Content-Type': 'text/html'});
    res.render('index'); 
});

nconf.set('acc_mode', 'true');
nconf.set('control_mode', 'tank');

nconf.save(function (err) {
if (err) {
  console.error(err.message);
  return;
}
console.log('Configuration saved successfully.');
});
//console.log(nconf.get('acc_mode'));

// Lors de la connection d'un client 
io.sockets.on('connection', function (socket) {
    console.log('New client connected: '+ socket.handshake.address);

    // Quand le serveur reçoit un signal de type "Coordinate" du client    
    socket.on('coordinate', function(data){
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
            breakmotor,
        R=0,
        L=0;

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
        //  R=parseInt(1/75000*Math.pow(R,3)+1/500*Math.pow(R,2)+1/15*R)
        //  L =parseInt(L);

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
        breakmotor = 0;
        console.log('L : '+L+ ' R :'+R+' radius : '+ radius + ' theta: '+ theta + ' LF='+ motorLForward +' LB='+motorLBackward+' RF='+ motorRForward+' RB='+motorRBackward);
        TRex.writeBytes(0x0F, [motorLForward, motorLBackward,motorRForward,motorRBackward,breakmotor], function(err) { if(err){console.log("i2c Error: "+ err);} });       

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

// Production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

console.log('Server Listening on port '+port);
console.log('Cast Control Interface: http://192.168.10.1:3000');
console.log('Camera Settings Interface: http://192.168.10.1:8080');
console.log('ENJOY YOUR RIDE ;) ');