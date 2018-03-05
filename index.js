let port_http = 8080;

var osc_eval = require('./osc_eval');

// if(process.argv[2] !== undefined)
// blah

let startTime = Date.now();
console.log("Scenic Eval launched at " + startTime);

// init dependencies
//var osc = require('node-osc');
var midi = require('midi');
const { exec } = require('child_process');

var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use('/', express.static('static'));

process.on('uncaughtException', function(err) {
    if(err.errno === 'EADDRINUSE')
         console.log("already running");
    else
         console.log(err);
    process.exit(1);
});

// Set up midi input / output
var midi_output = new midi.output();
var midi_input = new midi.input();

// aconnect routing
exec("aconnect 'RtMidi Output Client':0 'iConnectMIDI2+':2");
exec("aconnect 'iConnectMIDI2+':2 'RtMidi Input Client':0");

http.listen(port_http, function(){
  console.log('listening on *:' + port_http);
});


var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('command', function(msg){
    console.log('message: ' + msg.IP);
    let params = {startTime: startTime};
    let eval = new osc_eval(msg, params);
    eval.evaluate();

    // terminate
    setTimeout(function() {
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
    }, eval.tInterval * eval.numPackets + 1000);
  });
});

