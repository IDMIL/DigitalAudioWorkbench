//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 3, fill = "black",bezel =20) {
    this.background =  background;
    this.stroke = stroke;
    this.strokeWeight = strokeWeight;
    this.bezel = bezel;
    this.fill = fill;
    this.strokeClr = ["black",[28,48,65],'#B2ABF2',"blue","green"];//TODO - update these to less ugly colours

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

function drawSignal(panel, signal)
{
    let halfh = panel.buffer.height/2;
    let gain = halfh * 0.7;
    panel.buffer.noFill();
    panel.buffer.background(panel.background);
    panel.buffer.line(panel.bezel, halfh, panel.buffer.width-panel.bezel, halfh);
    panel.buffer.beginShape();
    for (let x = 0; x < panel.buffer.width - 2*panel.bezel; x++) {
      let y = halfh - gain * signal[x];
      panel.buffer.curveVertex(x + panel.bezel, y);
    }
    panel.buffer.endShape();
    panel.buffer.line(panel.bezel, halfh, panel.buffer.width-panel.bezel, halfh);
    panel.drawBorder();
}

class inputSigPanel extends Panel {
  drawPanel(){
    drawSignal(this, this.settings.original);
  }
}

class reconstructedSigPanel extends Panel {
  drawPanel(){
    drawSignal(this, this.settings.reconstructed);
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

function magnitude(real, cplx) {
  return Math.sqrt(real * real + cplx * cplx);
}

function drawFFT(panel, fft) {
  let base = panel.buffer.height - panel.bezel;
  let gain = (panel.buffer.height - 2 * panel.bezel);
  let offset = 100;
  let normalize = 4/fft.length;
  let xscale = (panel.buffer.width - 2*panel.bezel)/(fft.length/2);
  panel.buffer.background(panel.background);
  panel.buffer.strokeWeight(1);
  panel.buffer.stroke(panel.strokeClr[0]);
  panel.buffer.fill(panel.stroke);

  panel.buffer.beginShape();
  panel.buffer.vertex(panel.bezel, base);
  // fft.length / 2 because it is an interleaved complex array
  // with twice as many elements as it has (complex) numbers
  for (let x = 0; x <= fft.length/2; x++) {
    let xpos = xscale*x + panel.bezel;
    let ypos = base - gain * normalize * magnitude(fft[2*x], fft[2*x+1]);
    panel.buffer.vertex(xpos, ypos);
  }
  panel.buffer.vertex(panel.buffer.width - panel.bezel, base);
  panel.buffer.endShape(panel.buffer.CLOSE);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.stroke(panel.stroke);
  panel.drawBorder();
}

class inputSigFFTPanel extends Panel {
  drawPanel() {
    drawFFT(this, this.settings.originalFreq);
  }
}

class sampledSigFFTPanel extends Panel {
  drawPanel() {
    drawFFT(this, this.settings.reconstructedFreq);
  }
}

class impulsePanel extends Panel {
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
  }
  drawPanel(){
    let base = this.buffer.height * 0.75;
    let height = this.buffer.height * 0.25;
    this.buffer.background(this.background);
    this.drawBorder();
    this.buffer.line(this.bezel,base,this.buffer.width-this.bezel,base);

    let visibleSamples = Math.round((this.buffer.width - 2 * this.bezel)
                                    / this.settings.downsamplingFactor);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = this.bezel + x * this.settings.downsamplingFactor;
      this.buffer.line(xpos, base, xpos, height);
      this.buffer.ellipse(xpos, height, this.ellipseSize);
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
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
  }
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
      let ypos = halfh - gain * this.settings.downsampled[x];
      this.buffer.line(xpos, halfh, xpos, ypos);
      this.buffer.ellipse(xpos, ypos, this.ellipseSize);
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


class quantizedSignalPanel extends Panel{
  constructor(){
    super();
    this.bezel=30;
  }
  drawPanel(){
    //Draw quantized bit stem plot
    let max = Math.pow(2, this.settings.bitDepth - 1);

    let halfh = this.buffer.height/2;
    this.buffer.background(this.background);
    this.buffer.line(this.bezel, halfh , this.buffer.width-this.bezel, halfh);
    this.drawBorder();
    let xpos = 0; // first
    let ypos = 0;
    let imagePeriod = 20000 / this.buffer.width; // How many pixels before the wave repeats
    while (xpos<this.buffer.width-2*this.bezel){

      let sig = this.settings.signal[Math.round(xpos)];
//      ypos = Math.floor(sig*max+.5)/max;
      ypos = (Math.floor(sig*max)+.5)/max;
      console.log(sig +" is rounded to " +ypos);
      let noise = sig - ypos;
      this.buffer.fill(this.fill);
      this.buffer.line(xpos+this.bezel, halfh, xpos+this.bezel, halfh *(1- ypos));
      this.buffer.ellipse(xpos+this.bezel, halfh*(1-ypos), 5);
      this.buffer.stroke(this.strokeClr[2]); this.buffer.fill(this.strokeClr[2])
      this.buffer.line (xpos + this.bezel, halfh, xpos+this.bezel, halfh *(1- noise));
      this.buffer.ellipse(xpos+this.bezel, halfh*(1-noise), 5);
      this.buffer.stroke(this.strokeClr[0]);

      //xpos += 20000/this.settings.sampleRate*imagePeriod;
      xpos = xpos+ 20000 / this.settings.sampleRate * imagePeriod;

    }
    //TODO probably should combine these two loops
    this.buffer.beginShape(); this.buffer.noFill();
    for (let x = 0; x < this.settings.signal.length-2*this.bezel; x++) {
      //this.buffer.ellipse(x+this.bezel,this.settings.signal[x]*halfh+ halfh,1)
      this.buffer.curveVertex(x+this.bezel,halfh*(1-this.settings.signal[x]));
      // this.buffer.line(x+this.bezel, this.settings.signal[x - 1]*halfh + halfh,
                      // x+this.bezel, this.settings.signal[x]*halfh + halfh);
    }
    this.buffer.endShape();
    this.buffer.line(this.bezel, halfh, this.buffer.width-this.bezel, halfh);
    this.drawBorder();


}
}
class sliderPanel extends Panel{
  drawPanel(){
  }
}
