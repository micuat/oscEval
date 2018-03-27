var osc = require('node-osc');

module.exports = function (msg, params) {
  this.params = params;
  this.array = [];
  this.latency = [];
  this.numMatched = 0;

  this.server = new osc.Server(msg.in_port, '0.0.0.0');
  this.client = new osc.Client(msg.IP, msg.out_port);

  this.numPackets = msg.num_packets;
  this.tInterval = 1000.0 / msg.fps; // msec

  this.evaluate = function (printDebug, doneCallback) {
    for(let i = 0; i < this.numPackets; i++)
    {
      this.latency.push(NaN);
      this.array.push(Math.random().toFixed(8));
    }

    let self = this;
    for(let i = 0; i < this.numPackets; i++)
    {
      setTimeout(function() {
        let num = self.array[i];
        let hrTime = process.hrtime();
        let curTime = hrTime[0] * 1000 + hrTime[1] / 1000000 - self.params.startTime;
        self.client.send('/test', i, num, curTime, function (error) {
        });
      }, this.tInterval * i);
    }

    this.server.on('message', function (msg) {
      let hrTime = process.hrtime();
      let receivedTime = hrTime[0] * 1000 + hrTime[1] / 1000000 - self.params.startTime;
      if(msg[0] == '/test') {
        let index = msg[1];
        let arg = msg[2];
        let sentTime = msg[3];
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
    });

    // when done
    setTimeout(doneCallback, this.tInterval * this.numPackets + 1000);
  }

  this.getCorrectRate = function () {
    return parseFloat(this.numMatched) / this.latency.length;
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