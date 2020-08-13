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

  drawBorder(){
    this.buffer.line(this.bezel, this.bezel, this.bezel,this.height-this.bezel);
    this.buffer.line(this.bezel,this.height-this.bezel, this.width-this.bezel, this.height-this.bezel);
    this.buffer.line(this.width-this.bezel, this.height-this.bezel, this.width-this.bezel, this.bezel);
    this.buffer.line(this.width-this.bezel, this.bezel, this.bezel, this.bezel);

  }
  drawPanel(){ }

}

class inputSigPanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);
    let halfh = this.buffer.height/2;
    this.buffer.noFill();
    this.buffer.beginShape();
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
  //this.buffer.line(this.width, this.height, this.width, 0);


  }

}

class impulsePanel extends Panel {
  drawPanel(){
    this.buffer.background(this.background);
    this.drawBorder();

    let imagePeriod = 20000 / this.buffer.width; // How many pixels before the wave repeats
    this.buffer.line(this.bezel,this.height*.75,this.width-this.bezel,this.height*.75)

    let xpos = 0;//this.bezel*2; // first
    while (xpos<this.buffer.width-2*this.bezel){
      this.buffer.line(xpos+this.bezel, this.buffer.height * .75, xpos+this.bezel, this.buffer.height / 4);
      this.buffer.ellipse(xpos+this.bezel, this.buffer.height / 4, 10, 10);
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
    this.buffer.background(this.background);
    this.buffer.line(this.bezel, halfh , this.buffer.width-this.bezel, halfh);
    this.drawBorder();
    let xpos = 0; // first
    let imagePeriod = 20000 / this.buffer.width; // How many pixels before the wave repeats
    while (xpos<this.buffer.width-2*this.bezel){
      let ypos = this.settings.signal[Math.round(xpos)];
      console.log(xpos, ypos);
      this.buffer.line(xpos+this.bezel, halfh, xpos+this.bezel, halfh *(1- ypos));
      this.buffer.ellipse(xpos+this.bezel, halfh*(1-ypos), 10);
      //xpos += 20000/this.settings.sampleRate*imagePeriod;
      xpos = xpos+ 20000 / this.settings.sampleRate * imagePeriod;
      // console.log("Sampled xpos: ",xpos);
      // console.log("",this.settings.signal[xpos])

    }

    // for (let x = 0; x < this.buffer.width / imagePeriod; x++) {
    //     let xpos = Math.round(x * 20000 / this.settings.sampleRate * imagePeriod);
    //     this.buffer.line(xpos, halfh, xpos, this.settings.signal[xpos]*halfh + halfh);
    //     this.buffer.ellipse(xpos, this.settings.signal[xpos]*halfh + halfh, 10);
    //   }

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
