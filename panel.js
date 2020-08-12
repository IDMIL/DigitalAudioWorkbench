//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 3, fill = "white") {
    this.background =  "white";
    this.stroke = "black";
    this.strokeWeight = 3;
    this.bezel = 20;
    this.fill = "white";
    this.strokeClr = ["black","grey","pink","blue","green"];

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

  drawBorder(){
    let x1 = this.bezel;
    let y1 = this.bezel;
    let x2 = this.buffer.width - this.bezel;
    let y2 = this.buffer.height - this.bezel;
    this.buffer.line(x1, y1, x1, y2); // left side
    this.buffer.line(x1, y1, x2, y1); // top
    this.buffer.line(x2, y1, x2, y2); // right side
    this.buffer.line(x1, y2, x2, y2); // bottom
  }
  drawPanel(){ }

}

class inputSigPanel extends Panel {
  drawPanel(){
    let halfh = this.buffer.height/2;
    let gain = halfh * 0.7;
    this.buffer.background(this.background);
    this.buffer.line(this.bezel, halfh, this.buffer.width-this.bezel, halfh);
    this.buffer.beginShape();
    for (let x = 0; x < this.buffer.width - 2*this.bezel; x++) {
      let y = gain * this.settings.original[x] + halfh;
      this.buffer.curveVertex(x + this.bezel, y);
    }
    this.buffer.endShape();
    this.buffer.line(this.bezel, halfh, this.buffer.width-this.bezel, halfh);
    super.drawBorder();

  }
}

class inputSigFreqPanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);
    let halfh = (this.buffer.height)*.75;
    this.buffer.line(this.bezel, halfh, this.buffer.width-this.bezel, halfh);

  for (let x = 1; x <= this.settings.numHarm; x++) {
    let xpos = this.settings.fundFreq / 20000 * x * this.width / 2 - 1 +this.bezel;
    this.buffer.line(xpos, halfh, xpos, halfh * (1 - this.settings.amplitude * .66 / x));
  }
  let xpos = this.settings.sampleRate / 20000 * this.width / 4+this.bezel;
  this.buffer.line(this.bezel, this.bezel*2, xpos, this.bezel*2);
  this.buffer.line(xpos, this.bezel*2, xpos, halfh);

  this.drawBorder();
  }

}

class impulsePanel extends Panel {
  drawPanel(){
    let base = this.buffer.height * 0.75;
    let height = this.buffer.height * 0.25;
    this.buffer.background(this.background);
    this.drawBorder();

    let imagePeriod = 20000 / this.buffer.width; // How many pixels before the wave repeats
    this.buffer.line(this.bezel,this.height*.75,this.width-this.bezel,this.height*.75)

    let xpos = this.bezel;//this.bezel*2; // first
    while (xpos<this.buffer.width-2*this.bezel){
      this.buffer.line(xpos, this.buffer.height * .75, xpos, this.buffer.height / 4);
      this.buffer.ellipse(xpos, this.buffer.height / 4, 10, 10);
      xpos += 20000/this.settings.sampleRate*imagePeriod;
    }
  }
}

class impulseFreqPanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);
    this.buffer.fill(this.fill); this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.line(this.bezel, this.buffer.height*.75 , this.buffer.width-this.bezel, this.buffer.height*.75);

    for (let x = 0; x <= 4; x++) {
      let xpos = this.settings.sampleRate / 20000 * x * this.buffer.width/2+1+this.bezel;
      this.buffer.line(xpos, this.buffer.height *  .75, xpos, this.buffer.height / 4);
      if (x > 0) {
        this.buffer.text((x) + "FS", xpos-10, this.buffer.height - this.bezel*2)
      }
    }
    this.drawBorder();

  }
}

class sampledInputPanel extends Panel{
  drawPanel(){
    let halfh = this.buffer.height/2;
    let gain = halfh * 0.7;
    this.buffer.background(this.background);
    this.drawBorder();
    this.buffer.line(this.bezel, halfh , this.buffer.width-this.bezel, halfh);
    let visibleSamples = Math.round((this.buffer.width - 2 * this.bezel) 
                                    / this.settings.downsamplingFactor);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = Math.round(this.bezel + x * this.settings.downsamplingFactor);
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

    for (let x = 0; x <= 4; x++) {
      let xpos = this.settings.sampleRate / 20000 * x * (this.buffer.width) / 2;
      this.buffer.stroke(this.strokeClr[x]);
      if ((xpos < this.buffer.width-this.bezel*2) &(xpos > this.bezel)){
        this.buffer.line(xpos+this.bezel, ypos, xpos+this.bezel, this.buffer.height  / 8);
        this.buffer.line(xpos+this.bezel, this.buffer.height / 8, xpos+this.bezel, this.buffer.height / 8);
        this.buffer.text((x) + "FS", xpos+this.bezel-10, this.buffer.height - this.bezel*2)

      }

    //Draw harmonics
      for (let harm = 1; harm <= this.settings.numHarm; harm++) {
        let xPositive = xpos + this.settings.fundFreq * harm * this.buffer.width / 2 / 20000+this.bezel;
        let xNegative = xpos - this.settings.fundFreq * harm * this.buffer.width / 2 / 20000+this.bezel;
        let yEnd = ypos * (1 - this.settings.amplitude * .6 / harm);
        if ((xPositive > this.bezel) & (xPositive < this.buffer.width-this.bezel)){
          this.buffer.line(xPositive, ypos, xPositive, yEnd);
        }
        if ((xNegative > this.bezel) & (xNegative < this.buffer.width-this.bezel)){
        this.buffer.line(xNegative, ypos, xNegative, yEnd);
      }
      }

    }
    this.buffer.stroke(this.stroke);
    this.buffer.line(this.bezel, ypos, this.buffer.width-this.bezel, ypos);
    this.drawBorder();
  }
}


class quantizedInputSignal extends Panel{
  drawPanel(){
}
}
class sliderPanel extends Panel{
  drawPanel(){
  }
}
