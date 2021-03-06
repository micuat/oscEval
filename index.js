let port_http = 8080;

// time in milliseconds
var hrTime = process.hrtime()
let startTime = hrTime[0] * 1000 + hrTime[1] / 1000000;
console.log("OSC Eval launched at " + startTime);

// init dependencies
var osc = require('node-osc');

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
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('command', function(msg){
    console.log('message: ' + msg.IP);
    let array = [];
    let latency = [];
    let numMatched = 0;

    if(server != null) server.kill();
    server = new osc.Server(msg.in_port, '0.0.0.0');
    let client = new osc.Client(msg.IP, msg.out_port);

    let numPackets = msg.num_packets;
    let tInterval = 1000.0 / msg.fps; // msec

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
        let hrTime = process.hrtime();
        let curTime = hrTime[0] * 1000 + hrTime[1] / 1000000 - startTime;
        client.send('/test', i, num, curTime, function (error) {
        });
      }, tInterval * i);
    }

    server.on('message', function (msg) {
      let hrTime = process.hrtime();
      let receivedTime = hrTime[0] * 1000 + hrTime[1] / 1000000 - startTime;
    if(msg[0] == '/test') {
        let index = msg[1];
        let arg = msg[2];
        let sentTime = msg[3];
        let str = "";
        if(arg == array[index]) {
          str += index + " matched:  " + arg + " == " + array[index];
          numMatched += 1;
        }
        else {
          str += index + " mismatch: " + arg + " != " + array[index];
        }
        str += " latency: " + (receivedTime - sentTime) + " msec";
        socket.emit('log', str);
        console.log(str);
        latency[index] = receivedTime - sentTime;
      }
    });

    // terminate
    setTimeout(function() {
      // statistics
      let count = 0;
      let sum = 0;
      for(let i = 0; i < array.length; i++) {
        if(!isNaN(latency[i])) {
          sum += latency[i];
          count++;
        }
      }
      let avg = sum / count;
      let str = "--------";
      socket.emit('log', str);
      console.log(str);
      str = "error packets: " + (numPackets - count) + " out of " + numPackets;
      socket.emit('log', str);
      console.log(str);
      str = "average latency: " + avg + " msec";
      socket.emit('log', str);
      console.log(str);
      str = "statistics";
      socket.emit('log', str);
      console.log(str);
      str = "--------";
      socket.emit('log', str);
      console.log(str);
    }, tInterval * numPackets + 1000);
  });
});
