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

// Set "Public" 
app.use(express.static(__dirname + '/public'));  

// Chargement de socket.io
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
    socket.emit('message', 'Vous êtes bien connecté !');

    // Quand le serveur reçoit un signal de type "Coordinate" du client    
    socket.on('coordinate', function(data){
        // Récupération des coordonnées 
        var DXL = data.DXL;
        var DYL = data.DYL * -1;
        var DXR = data.DXR;
        var DYR = data.DYR * -1;
        console.log('LEFT Coordinate: X = ' + DXL + '; Y = '+DYL);
        console.log('RIGHT Coordinate: X = ' + DXR + '; Y = '+DYR);
        //exec('python i2c.py ',+ DXL +' '+ DYL);      // Execute Python Script with X&Y paramsx    
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
console.log('ENJOY YOUR RIDE ;) ');