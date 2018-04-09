let port_http = 8080;

var osc_eval = require('./osc_eval');
var osc = require('node-osc');

var oscMode = true;
var resx = 800/2, resy = 600/2;

var keepAlivePort = 12001;
var keepAliveIp = '10.10.30.38';

const { exec } = require('child_process');

if(process.argv[2] !== undefined) {
  if(process.argv[2] == 'midi') {
    var midi_eval = require('./midi_eval');
    oscMode = false;
    port_http = 8081;
  }
}
if(process.argv[3] !== undefined
&& process.argv[4] !== undefined) {
  resx = process.argv[3];
  resy = process.argv[4];
}

setInterval(function() {
  if(oscMode) {
    exec('wmctrl -r \'OSC Eval\' -e 0,0,0,' + resx + ',' + resy);
    let client = new osc.Client(keepAliveIp, keepAlivePort);
    client.send('/scenic/keepalive', function (error) {});
  }
  else {
    exec('wmctrl -r \'MIDI Eval\' -e 0,' + resx + ',0,' + resx + ',' + resy);
    let eval = new midi_eval();
    eval.keepAlive({num_packets:0}, {});
  }
}, 1000);

// time in milliseconds
var hrTime = process.hrtime()
let startTime = hrTime[0] * 1000 + hrTime[1] / 1000000;
console.log("Scenic Eval launched at " + startTime);

// init dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use('/', express.static('static'));

var server;

process.on('uncaughtException', function(err) {
    if(err.errno === 'EADDRINUSE')
         console.log("already running");
    else
         console.log(err);
    process.exit(1);
});

http.listen(port_http, function(){
  console.log('listening on *:' + port_http);
});


var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('oscmode', oscMode);

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('set_ip', function(msg){
    keepAliveIp = msg;
  });
  socket.on('set_out_port', function(msg){
    keepAlivePort = msg;
  });
  socket.on('command', function(msg){
    console.log('message: ' + msg.IP);

    let params = {startTime: startTime};

    function printDebug (str) {
      socket.emit('log', str);
      console.log(str);
    }

    function doneEvaluation () {
      // statistics
      let str = "--------";
      socket.emit('log', str);
      console.log(str);
      str = "correct rate: " + eval.getCorrectRate();
      socket.emit('log', str);
      console.log(str);
      str = "average latency: " + eval.getAverageLatency() + " msec";
      socket.emit('log', str);
      console.log(str);
      str = "statistics";
      socket.emit('log', str);
      console.log(str);
      str = "--------";
      socket.emit('log', str);
      console.log(str);
    }

    let eval = null;
    if(oscMode) {
      eval = new osc_eval(msg, params);
    } else {
      eval = new midi_eval(msg, params);
    }
    eval.evaluate(printDebug, doneEvaluation);
  });
});

