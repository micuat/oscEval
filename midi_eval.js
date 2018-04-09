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
  this.keepAlive = function () {midi_output.sendMessage([226, 0, 0]);}

  this.params = params;
  this.array = [];
  this.latency = [];
  this.sentTimes = [];
  this.numMatched = 0;

  if(msg !== undefined) {
    this.numPackets = msg.num_packets;
    if (this.numPackets > 128 * 128) this.numPackets = 128 * 128;
    this.tInterval = 1000.0 / msg.fps; // msec
  }
  else {
    this.numPackets = 0;
    this.tInterval = 1;
  }

  this.evaluate = function (printDebug, doneCallback) {

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
        // 2224: 11100000 pitch bend change
        let m = [224, parseInt(num / 128), num % 128];
        midi_output.sendMessage(m);
        let hrTime = process.hrtime();
        let sentTime = hrTime[0] * 1000 + hrTime[1] / 1000000 - self.params.startTime;
        self.sentTimes[i] = sentTime;
        //console.log('send ', m);
      }, this.tInterval * i);
    }

    function onMidi (deltaTime, msg) {
      console.log('received m:' + msg + ' d:' + deltaTime);
      let hrTime = process.hrtime();
      let receivedTime = hrTime[0] * 1000 + hrTime[1] / 1000000 - self.params.startTime;
      if(true) { // can be used for note/control detection
        let index = msg[1] * 128 + msg[2];
        let arg = msg[1] * 128 + msg[2];
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
        printDebug(str);
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
