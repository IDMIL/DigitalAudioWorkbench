const background = "white";
const stroke = "black";
const strokeWeight = 3;
const fill = "white";

//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(name,height,width,signal) {
    this.name = name;
    this.height = height;
    this.width = width;
    this.signal = signal;
  }

  setup(p) {
    this.buffer = p.createGraphics(this.width, this.height);
    this.buffer.strokeWeight(strokeWeight);
    this.buffer.background(background);
    this.buffer.stroke(stroke);
    this.buffer.fill(fill);
  }

  drawPanel(x,y){ }
}

class inputSigPanel extends Panel {
  drawPanel(x,y){
    this.buffer.background(background);
    let halfh = this.buffer.height/2;
    this.buffer.line(0, halfh, this.buffer.width, halfh);
    for (let x = 0; x < this.signal.length; x++) {
      this.buffer.line(x - 1, this.signal[x - 1] + halfh, 
                       x, this.signal[x] + halfh);
    }
  }
}

class inputSigFreqPanel extends Panel {
  drawPanel(x,y){
  }
}

class impulsePanel extends Panel {
  drawPanel(x,y){
  }
}

class impulseFreqPanel extends Panel {
  drawPanel(x,y){
  }
}

class sampledInputPanel extends Panel{
  drawPanel(x,y){
  }
}

class sampledInputFreqPanel extends Panel{
  drawPanel(x,y){
  }
}

class interfacePanel extends Panel{
  drawPanel(x,y){
  }
}
