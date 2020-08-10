//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 3, fill = "white") {
    this.background =  "white";
    this.stroke = "black";
    this.strokeWeight = 3;

    this.fill = "white";
  }

  setup(p, height, width, settings) {
    this.height = height;
    this.width = width;
    this.settings = settings;
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

  drawPanel(){ }
}

class inputSigPanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);
    let halfh = this.buffer.height/2;
    this.buffer.line(0, halfh, this.buffer.width, halfh);
    for (let x = 0; x < this.settings.signal.length; x++) {
      this.buffer.line(x - 1, this.settings.signal[x - 1] + halfh,
                       x, this.settings.signal[x] + halfh);
    }
  }
}

class inputSigFreqPanel extends Panel {
  drawPanel(){
    this.buffer.background(255, 125, 125);
    let halfh = this.buffer.height/2;
    this.buffer.line(0, halfh, this.buffer.width, halfh);

  for (let x = 1; x <= this.settings.numHarm; x++) {
    let xpos = this.settings.fundFreq / 20000 * x * this.width / 2 - 1;
    this.buffer.line(xpos, halfh, xpos, halfh * (1 - this.settings.amplitude * .8 / x));
  }
  let xpos = this.settings.sampleRate / 20000 * this.width / 4;
  this.buffer.line(0, halfh * .1, xpos, halfh * .1)
  this.buffer.line(xpos, halfh * .1, xpos + 1, halfh)
  }
}

class impulsePanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);

    let imagePeriod = 20000 / this.buffer.width; // How many pixels before the wave repeats

    this.buffer.line(0,this.height*.75,this.width,this.height*.75)

    for (let x = 0; x < this.buffer.width / imagePeriod; x++) {
      console.log(this.buffer.width/imagePeriod)
      let xpos = x * 20000 / this.settings.sampleRate * imagePeriod;
        this.buffer.line(xpos, this.buffer.height * .75, xpos, this.buffer.height / 4);
        this.buffer.ellipse(xpos, this.buffer.height / 4, 10, 10);
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

    this.buffer.background(this.background);
    this.buffer.line(0, this.buffer.height/2 , this.buffer.width, this.buffer.height/2);
    let imagePeriod = 20000 / this.buffer.width; // How many pixels before the wave repeats
      for (let x = 0; x < this.buffer.width / imagePeriod; x++) {
        let xpos = Math.round(x * 20000 / this.settings.sampleRate * imagePeriod);
        this.buffer.line(xpos, this.buffer.height/2, xpos, this.settings.signal[xpos] + this.buffer.height/2);
        this.buffer.ellipse(xpos, this.settings.signal[xpos] + this.buffer.height/2, 10);
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
