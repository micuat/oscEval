// Set up midi input / output
var midi = require('midi');
const { exec } = require('child_process');

var midi_output = new midi.output();
var midi_input = new midi.input();

// Create a virtual ports
midi_output.openVirtualPort("midiEval Output");
midi_input.openVirtualPort("midiEval Input");

// aconnect routing
exec("aconnect 'RtMidi Output Client':0 'iConnectMIDI2+':2");
exec("aconnect 'iConnectMIDI2+':2 'RtMidi Input Client':0");
exec("aconnect -l", (err, stdout, stderr) => {
  console.log(stdout);
  console.log(stderr);
});

module.exports = function (msg, params) {

  this.params = params;
  this.array = [];
  this.latency = [];
  this.sentTimes = [];
  this.numMatched = 0;

  this.numPackets = msg.num_packets;
  this.tInterval = 1000.0 / msg.fps; // msec

  this.evaluate = function (doneCallback) {

    for(let i = 0; i < this.numPackets; i++)
    {
      this.latency.push(NaN);
      //this.array.push(Math.floor(Math.random()*128));
      this.array.push(i);
    }

    let self = this;
    for(let i = 0; i < this.numPackets; i++)
    {
      setTimeout(function() {
        let num = self.array[i];
        let m = [176,22, num];
        midi_output.sendMessage(m);
        let sentTime = Date.now() - self.params.startTime;
        self.sentTimes[i] = sentTime;
        //console.log('send ', m);
      }, this.tInterval * i);
    }

    function onMidi (deltaTime, msg) {
      console.log('received m:' + msg + ' d:' + deltaTime);
      let receivedTime = Date.now() - self.params.startTime;
      if(true) { // can be used for note/control detection
        let index = msg[2];
        let arg = msg[2];
        let sentTime = self.sentTimes[index];
        let str = "";
        if(arg == self.array[index]) {
          str += index + " matched:  " + arg + " == " + self.array[index];
          self.numMatched += 1;
        }
        else {
          str += index + " mismatch: " + arg + " != " + self.array[index];
        }
        str += " latency: " + (receivedTime - sentTime) + " msec";
        //socket.emit('log', str);
        console.log(str);
        self.latency[index] = receivedTime - sentTime;
      }
    }

    midi_input.on('message', onMidi);

    // when done
    setTimeout(function () {
      doneCallback();
      midi_input.removeListener('message', onMidi);
    }, this.tInterval * this.numPackets + 1000);
  }

  this.getCorrectRate = function () {
    return parseFloat(this.numMatched) / this.array.length;
  }

  this.getAverageLatency = function () {
    let count = 0;
    let sum = 0;
    for(let i = 0; i < this.array.length; i++) {
      if(this.latency[i] != NaN) {
        sum += this.latency[i];
        count++;
      }
    }
    return sum / count;
  }
}
