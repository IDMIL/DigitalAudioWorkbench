//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 3, fill = "white") {
    this.background =  "white";
    this.stroke = "black";
    this.strokeWeight = 3;

    this.fill = "white";
  }

  setup(p, height, width, settings) {
    this.settings = settings;
    this.buffer = p.createGraphics(width, height);
    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    this.buffer.fill(this.fill);
  }

  setbackground(backgroundClr){ this.background = backgroundClr; }
  setStroke(strokeClr){ this.stroke = strokeClr; }
  setStrokeWeight(strokeWgt){ this.strokeWeight = strokeWgt; }
  setFill(fillClr){ this.fill = fillClr; }

  drawPanel(){ }
}

class inputSigPanel extends Panel {
  drawPanel(){
    let halfh = this.buffer.height/2;
    let gain = halfh * 0.9;
    this.buffer.background(this.background);
    this.buffer.line(0, halfh, this.buffer.width, halfh);
    for (let x = 0; x < this.buffer.width; x++) {
      this.buffer.line(x - 1, gain * this.settings.original[x - 1] + halfh,
                       x, gain * this.settings.original[x] + halfh);
    }
  }
}

class inputSigFreqPanel extends Panel {
  drawPanel(){
    this.buffer.background(255, 125, 125);
    let halfh = this.buffer.height/2;
    this.buffer.line(0, halfh, this.buffer.width, halfh);

  for (let x = 1; x <= this.settings.numHarm; x++) {
    let xpos = this.settings.fundFreq / 20000 * x * this.buffer.width / 2 - 1;
    this.buffer.line(xpos, halfh, xpos, halfh * (1 - this.settings.amplitude * .8 / x));
  }
  let xpos = this.settings.sampleRate / 20000 * this.buffer.width / 4;
  this.buffer.line(0, halfh * .1, xpos, halfh * .1)
  this.buffer.line(xpos, halfh * .1, xpos + 1, halfh)
  }
}

class impulsePanel extends Panel {
  drawPanel(){
    let base = this.buffer.height * 0.75;
    let height = this.buffer.height * 0.25;
    this.buffer.background(this.background);
    this.buffer.line(0, base, this.buffer.width, base)

    for (let x = 0; x < Math.round(this.buffer.width / this.settings.downsamplingFactor); x++) {
      let xpos = x * this.settings.downsamplingFactor;
        this.buffer.line(xpos, base, xpos, height);
        this.buffer.ellipse(xpos, height, 10, 10);
    }

  }
}

class impulseFreqPanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);

    this.buffer.line(0, this.buffer.height*.75 , this.buffer.width, this.buffer.height*.75);

    for (let x = 0; x <= 4; x++) {
      let xpos = this.settings.sampleRate / 20000 * x * this.buffer.width/2;
      this.buffer.line(xpos, this.buffer.height *  .75, xpos, this.buffer.height / 4);
      if (x > 0) {
        this.buffer.text((x) + "FS", xpos - 5, this.buffer.height - 10)
      }
    }
  }
}

class sampledInputPanel extends Panel{
  drawPanel(){
    let halfh = this.buffer.height/2;
    let gain = halfh * 0.9;
    this.buffer.background(this.background);
    this.buffer.line(0, halfh, this.buffer.width, halfh);
    for (let x = 0; x < Math.round(this.buffer.width / this.settings.downsamplingFactor); x++) {
      let xpos = Math.round(x * this.settings.downsamplingFactor);
      let ypos = gain * this.settings.downsampled[x] + halfh;
      this.buffer.line(xpos, halfh, xpos, ypos);
      this.buffer.ellipse(xpos, ypos, 10);
    }
  }
}

class sampledInputFreqPanel extends Panel{
  drawPanel(){
    let ypos = this.buffer.height * .75;
    this.buffer.background(this.background);
    this.buffer.line(0, ypos, this.buffer.width, ypos);

    for (let x = 0; x <= 4; x++) {
      let xpos = this.settings.sampleRate / 20000 * x * this.buffer.width / 2;
      //Draw impulse resp
      this.buffer.line(xpos, ypos, xpos, this.buffer.height  / 8);
      this.buffer.line(xpos, this.buffer.height / 8, xpos, this.buffer.height / 8);
      //Draw harmonics
      for (let harm = 1; harm <= this.settings.numHarm; harm++) {
        let xPositive = xpos + this.settings.fundFreq * harm * this.buffer.width / 2 / 20000;
        let xNegative = xpos - this.settings.fundFreq * harm * this.buffer.width / 2 / 20000;
        let yEnd = ypos * (1 - this.settings.amplitude * .6 / harm);
        this.buffer.line(xPositive, ypos, xPositive, yEnd);
        this.buffer.line(xNegative, ypos, xNegative, yEnd);
      }
    }
  }
}

class sliderPanel extends Panel{
  drawPanel(){
  }
}
