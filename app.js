var http = require('http');
var fs = require('fs');
// NEVER use a Sync function except at start-up!
var index = fs.readFileSync(__dirname + '/index.html');
var express = require('express');
var app = express();
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

// Socket.io loading
var io = require('socket.io').listen(server);

// ROUTES
app.get('/', function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(index);	
});

// Lors de la connection d'un client 
io.sockets.on('connection', function (socket) {
    console.log('New connected client: '+ socket.handshake.address);

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
            breakmotor;

        var radius = Math.sqrt(DXL*DXL + DYL*DYL);
        var theta = 2* Math.atan(DYL/(DXL+ radius));
        var pi = Math.PI;

        if(-pi<=theta<-(pi/2))
        {
        	R = -radius;
        	L = -radius*(2*theta/pi - pi);
        }
        else if(-pi/2<=theta<0)
        {
        	R = -radius(2*theta/pi);
        	L = -radius;
        }
        else if(0<=theta<pi/2)
        {
        	R = radius*2*theta/pi;
        	L = radius;
        }
        else if(pi/2<=theta<=pi)
        {
        	R = radius;
        	L = radius *(2*theta/pi + pi);
        }


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
        breakmotor = 0;
        //console.log('motorLForward='+ motorLForward +' motorLBackward='+motorLBackward+' motorRForward='+ motorRForward+' motorRBackward='+motorRBackward);
        TRex.writeBytes(0x0F, [motorLForward, motorLBackward,motorRForward,motorRBackward,breakmotor], function(err) { if(err){console.log("i2c Error: "+ err);} });       

    });
});

// Read Battery Level 
// setInterval(function(){
//     TRex.readBytes(0x0C, 2, function(err, res) {
//         // result contains a buffer of bytes
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
    

