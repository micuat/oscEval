let numPackets = 100;
let tInterval = 1000.0 / 60.0; // msec
let port_http = 8080;

let startTime = Date.now();
console.log("OSC Eval launched at " + startTime);

// init dependencies
var osc = require('node-osc');
var server = new osc.Server(12000, '0.0.0.0');
var client = new osc.Client('', 12001);

var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use('/', express.static('static'));

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
    // console.log('message: ' + msg);
    let array = [];
    let latency = [];
    let numMatched = 0;

    for(let i = 0; i < numPackets; i++)
    {
      latency.push(NaN);
      array.push(Math.random().toFixed(8));
      //array.push(i);
    }

    for(let i = 0; i < numPackets; i++)
    {
      setTimeout(function() {
        let num = array[i];
        client.send('/test', i, num, Date.now() - startTime, function (error) {
          //console.log("sent " + i);
        });
      }, tInterval * i);
    }

    server.on('message', function (msg) {
      let receivedTime = Date.now() - startTime;
      if(msg[0] == '/test') {
        let index = msg[1];
        let arg = msg[2];
        let sentTime = msg[3];
        if(arg == array[index]) {
          console.log(index + " matched:  " + arg + " == " + array[index]);
          numMatched += 1;
        }
        else {
          console.log(index + " mismatch: " + arg + " != " + array[index]);
        }
        console.log("latency: " + (receivedTime - sentTime) + " msec");
        latency[index] = receivedTime - sentTime;
      }
    });
    console.log('message: ' + msg.IP + " " + msg.in_port + " " + msg.out_port);

  });
});

// logging
// var fs = require('fs');
// var util = require('util');
// var log_file = fs.createWriteStream('/home/pi/shared/scenesouvertes/raspi_ble_osc/log', {flags: 'w'});
// var log_stdout = process.stdout;
// console.log = function(d) {
//   log_file.write(util.format(d) + '\n');
//   log_stdout.write(util.format(d) + '\n');
// }



// terminate
// setTimeout(function() {
//   // statistics
//   let sum = latency.reduce((previous, current) => current += previous);
//   let avg = sum / latency.length;
//   console.log("--------");
//   console.log("statistics");
//   console.log("average latency: " + avg + " msec");
//   console.log("correct rate: " + parseFloat(numMatched) / latency.length);

//   process.exit();
// }, tInterval * numPackets + 1000);
