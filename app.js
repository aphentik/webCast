var http = require('http');
var fs = require('fs');
// NEVER use a Sync function except at start-up!
var index = fs.readFileSync(__dirname + '/index.html');
var express = require('express');
var app = express();
var port= 3000;
var server = app.listen(port);
var url = require('url');
var querystring = require('querystring');
var exec = require('child_process').exec;
var i2c = require('i2c');
var address = 0x07;
var TRex = new i2c(address, {device: '/dev/i2c-1'});
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

app.get('/action', function(req, res) {
	var params = querystring.parse(url.parse(req.url).query);	//Get URL params	
	exec('python i2c.py',+ params[' X'] + params[' Y']);		// Execute Python Script with X&Y params
	console.log(params['X'] + params['Y']);						// Print Params
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(index);	
});

// Lors de la connection d'un client 
io.sockets.on('connection', function (socket) {
    socket.emit('message', 'Welcome, you are connected !');
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

        var motorRForward,
            motorRBackward,
            motorLForward,
            motorLBackward,
            breakmotor;
        var V=(100-Math.abs(DXL))*(DYL/100)+DYL;
        var W=(100-Math.abs(DYL))*(DXL/100)+DXL;
        var R= parseInt((V+W)/2);
        var L=parseInt((V-W)/2);
        if(R>0){
            motorRForward = R * coeff +offset;
            motorRBackward = 0;
        }else if(R<0){
            motorRBackward = -(R *coeff)- offset;
            motorRForward = 0;
        }else{
            motorRForward = 0;
            motorRBackward = 0;
        }  
        if(L>0){
            motorLForward = L *coeff + offset;
            motorLBackward = 0;
        }else if(L<0) {
            motorLBackward = -L*coeff- offset;
            motorLForward = 0;
        }else{
            motorLForward = 0;
            motorLBackward = 0;
        }
        breakmotor = 0;
        TRex.writeBytes(0x0F, [motorLForward,motorLBackward,motorRForward,motorRBackward,breakmotor], function(err) { if(err){console.log('Error:'+err);} });        
    });
});

// Will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

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
console.log('Control interface: http://192.168.10.1:3000');
console.log('Camera interface: http://192.168.10.1:8080');
console.log('ENJOY YOUR RIDE ;) ');