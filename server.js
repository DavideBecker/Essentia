var SerialPort = require("serialport");
var fs = require("fs");

// app.js
var express = require('express');
// var app = express();  
// var server = require('http').createServer(app);  
// var io = require('socket.io')(server);

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// // Serial Port setup
// var SerialPort = serialport.SerialPort;
// var serialPort = new SerialPort('/dev/cu.usbmodem1411', {
//     baudrate: 115200,
//     parser: new serialport.parsers.Readline("\n")
// });

// serialPort.on("open", function () {
//     console.log("SerialPort Open")
//     serialPort.on('data', function(data) {
// 	var chkdata = data.split(",");
// 	var ID = chkdata[0];
// 	var event = chkdata[1];
// 	console.log("ID: "+ID);
// 	console.log("Event: "+event);
// 	addCheckinEvent(ID, event);
//     });
// });


var timeout

const port = new SerialPort('/dev/cu.usbmodem1411');
if(port) {
    const parser = new SerialPort.parsers.Readline();
    port.pipe(parser);
    parser.on('data', function(data) {

        if(!timeout) {
            console.log('appeared', data);
            io.emit('tagAppeared', data.replace(/ /g,'').replace(/\n/g,'').replace(/\r/g,'').replace(/\s/g,''));
        } else {
            clearTimeout(timeout);
        }

        timeout = setTimeout(function() {
            console.log('disappeared', data);
            io.emit('tagDisappeared', data.replace(/ /g,'').replace(/\n/g,'').replace(/\r/g,'').replace(/\s/g,''));
            timeout = false;
        }, 100)
    });
}

io.on('connection', (socket) => {
    console.log('user connected')
    // add handlers for socket events

    socket.on('tagAppeared', function() {
        io.emit('tagAppeared', 1)
    })

    socket.on('tagDisappeared', function() {
        io.emit('tagDisappeared', 1)
    })

    socket.on('finishing', function() {
        io.emit('finishing', 1)
    })
});

fs.watch('./assets/styles.css', function(event, file) {
    console.log(event, file)
    io.emit('refresh', file)
})

fs.watch('./index.html', function(event, file) {
    console.log(event, file)
    io.emit('refresh', 1)
})

fs.watch('./assets/scripts.js', function(event, file) {
    console.log(event, file)
    io.emit('refresh', 1)
})

// app.use(express.static(__dirname + '/node_modules'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/front.jpg', function(req, res,next) {  
    res.sendFile(__dirname + '/front.jpg');
});

app.get('/back.jpg', function(req, res,next) {  
    res.sendFile(__dirname + '/back.jpg');
});

server.listen(4200);  