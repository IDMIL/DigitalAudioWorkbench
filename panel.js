//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(name,height,width,signal) {
    this.name = name;
    this.height = height;
    this.width = width;
    this.signal = signal;
    this.background =  "white";
    this.stroke = "black";
    this.strokeWeight = 3;
    this.fill = "white";
  }

  setup(p) {
    this.buffer = p.createGraphics(this.width, this.height);
    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    this.buffer.fill(this.fill);
  }

  setbackground(backgroundClr){ this.background = backgroundClr; }
  setStroke(strokeClr){ this.stroke = strokeClr; }
  setStrokeWeight(strokeWgt){ this.strokeWeight = strokeWgt; }
  setFill(fillClr){ this.fill = fillClr; }

  drawPanel(x,y){ }
}

class inputSigPanel extends Panel {
  drawPanel(x,y){
    this.buffer.background(this.background);
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
