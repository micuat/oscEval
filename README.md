oscEval
========

simple OSC network checker by Naoto Hieda

run repeater on a client (Processing example)

```
/**
 * oscRepeater based on
 * oscP5parsing by andreas schlegel
 */

import oscP5.*;
import netP5.*;

OscP5 oscP5;
NetAddress myRemoteLocation;

void setup() {
  size(400, 400);
  frameRate(25);
  oscP5 = new OscP5(this, 12001);

  myRemoteLocation = new NetAddress("127.0.0.1", 12000);
}

void draw() {
  background(0);  
}

void oscEvent(OscMessage m) {
  println("### received an osc message. with address pattern "+m.addrPattern() + " " + m.typetag());
  if (m.checkAddrPattern("/test")==true) {
    int ms = 1; //msec
    delay(ms);
    oscP5.send(m, myRemoteLocation);
  }
}
```

on server,

    node index.js

access to localhost:8080 and select target (client) IP and start.
