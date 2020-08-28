//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 1, fill = "black",bezel =40) {
    this.background =  background;
    this.stroke = stroke;
    this.strokeWeight = strokeWeight;
    this.bezel = bezel;
    this.fill = fill;
    this.xAxis= "Time";
    this.yAxis = "Amp";
  }

  setup(p, height, width, settings) {
    this.settings = settings;
    this.buffer = p.createGraphics(width, height);
    this.bufferInit();
    this.buffer.textFont('Helvetica',20);
    this.buffer.textAlign(p.CENTER);
  }

  resize(h, w) {
    this.buffer.resizeCanvas(w, h);
  }
  bufferInit(){
    this.buffer.background(this.background);
    this.buffer.fill(this.fill);
    this.buffer.stroke(this.stroke);
    this.buffer.strokeWeight(this.strokeWeight);
  }
  drawStem(x,y,startHeight){
    this.buffer.line(x, startHeight, x, y);
    this.buffer.ellipse(x, y, this.ellipseSize);
  };

  setbackground(backgroundClr){ this.background = backgroundClr; }
  setStroke(strokeClr){ this.stroke = strokeClr; }
  setStrokeWeight(strokeWgt){ this.strokeWeight = strokeWgt; }
  setFill(fillClr){ this.fill = fillClr; }

  drawBorder(){
    let x1 = this.bezel; let y1 = this.bezel;
    let x2 = this.buffer.width - this.bezel;
    let y2 = this.buffer.height - this.bezel;
    this.buffer.line(x1, y1, x1, y2); // left side
    this.buffer.line(x1, y1, x2, y1); // top
    this.buffer.line(x2, y1, x2, y2); // right side
    this.buffer.line(x1, y2, x2, y2); // bottom
  }
  drawPanel(){}
}

class freqPanel extends Panel{
  constructor(){ super(); this.xAxis = "Frequency";
  }
  drawPeak(x,height,base,colour="black"){
    this.buffer.fill(colour); this.buffer.stroke(colour);
    this.buffer.beginShape();
    if (x<this.bezel || x>this.buffer.width-this.bezel){return}
    let x1=x-1; let x2 = x+1;
    if (x1 < this.bezel) {x1=this.bezel}
    if (x2 > this.buffer.width-this.bezel) {x2=this.bufferWidth-this.bezel}
    this.buffer.vertex(x1, base);
    this.buffer.vertex(x, (this.buffer.height-this.bezel)-height);
    this.buffer.vertex(x2, base);
    this.buffer.vertex(x, base);
    this.buffer.endShape();
    this.buffer.stroke(this.stroke); this.buffer.fill(this.fill);
  }
}

function drawSignal(panel, signal)
{
  let halfh = panel.buffer.height/2;
  let pixel_max = (halfh - panel.bezel) * 0.7;
  let pixel_per_fullscale = pixel_max;
  panel.buffer.noFill();
  panel.buffer.background(panel.background);
  panel.buffer.beginShape();
  for (let x = 0; x < panel.buffer.width - 2*panel.bezel; x++) {
    let pixel_amp = pixel_per_fullscale * signal[x];
    let y = halfh - pixel_amp;
    panel.buffer.curveVertex(x + panel.bezel, y);
  }
  panel.buffer.endShape();
  panel.buffer.line(panel.bezel, halfh, panel.buffer.width-panel.bezel, halfh);
  panel.drawBorder();
}
function drawDiscreteSignal(panel,signal){
  let halfh = panel.buffer.height/2;
  let gain = (halfh - panel.bezel) * 0.7;
  panel.buffer.background(panel.background);
  panel.drawBorder();
  panel.buffer.line(panel.bezel, halfh , panel.buffer.width-panel.bezel, halfh);
  let visibleSamples = Math.round((panel.buffer.width - 2 * panel.bezel)
                                  / panel.settings.downsamplingFactor);
  for (let x = 0; x < visibleSamples; x++) {
    let xpos = Math.round(panel.bezel + x * panel.settings.downsamplingFactor);
    let ypos = halfh - gain * signal[x];
    panel.drawStem(xpos,ypos,halfh);
  }
  drawLabels(panel)

}
function drawLabels(panel){
  panel.buffer.fill(panel.fill);
  panel.buffer.textFont('Helvetica',20);
  panel.buffer.text (panel.name, panel.buffer.width/2,20);
  panel.buffer.textFont('Helvetica',15);

  drawAxisLabelX(panel);
  drawAxisLabelY(panel);
}

function drawAxisLabelX(panel){
  panel.buffer.text (panel.xAxis, panel.buffer.width/2,panel.buffer.height-10);
}

function drawAxisLabelY(panel){
  panel.buffer.text (panel.yAxis, 15,panel.buffer.height/2);
}
function getColor(num){
  return [num*666%255,num*69%255,num*420%255]
}

class inputSigPanel extends Panel {
  constructor(){super(); this.name="Continuous Signal"}

  drawPanel(){
    drawSignal(this, this.settings.original);
    drawLabels(this);
  }
}

class reconstructedSigPanel extends Panel {
  constructor(){super(); this.name="Reconstructed Signal";};

  drawPanel(){
    drawSignal(this, this.settings.reconstructed);
    drawLabels(this);
  }
}

class inputSigFreqPanel extends freqPanel {
  constructor(){super(); this.name="Input Signal Frequency";}
  drawPanel(){
    this.buffer.background(this.background);
    let ypos = this.buffer.height-this.bezel

  for (let x = 1; x <= this.settings.numHarm; x++) {
    let xpos = this.settings.fundFreq / (this.settings.sampleRate/2) * x * (this.buffer.width-this.bezel*2) - 1 +this.bezel;
    this.drawPeak(xpos,this.settings.amplitude*(this.buffer.height-this.bezel*2)/x,ypos)
  }

  this.drawBorder();
  drawLabels(this);
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

class inputSigFFTPanel extends freqPanel {
  constructor(){super(); this.name = "Input Signal FFT";}

  drawPanel() {
    drawFFT(this, this.settings.originalFreq);
    drawLabels(this);
  }
}

class sampledSigFFTPanel extends freqPanel {
  constructor(){super(); this.name="Reconstructed Signal FFT";}
  drawPanel() {
    drawFFT(this, this.settings.reconstructedFreq);
    drawLabels(this);
  }
}

class impulsePanel extends Panel {
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name ="Sampling Signal";
  }
  drawPanel(){
    let base = (this.buffer.height -this.bezel);
    let height = this.buffer.height * 0.35;
    this.buffer.background(this.background);
    this.drawBorder();

    let visibleSamples = Math.round((this.buffer.width - 2 * this.bezel)
                                    / this.settings.downsamplingFactor);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = this.bezel + x * this.settings.downsamplingFactor;
      this.drawStem(xpos,height,base);

    }
    drawLabels(this);

  }
}

class impulseFreqPanel extends freqPanel {
  constructor(){super(); this.name="Sampling Signal FFT";}
  drawPanel(){
    this.bufferInit();
    let base = this.buffer.height-this.bezel;
    let numPeaks = this.settings.downsamplingFactor/2;

    for (let peak = 0;peak<=numPeaks;peak++){
      let xpos = peak/numPeaks*(this.buffer.width-2*this.bezel)+this.bezel;
      let color= getColor(peak);
      this.drawPeak(xpos,this.buffer.height-this.bezel*2,base,color)

    }
    this.drawBorder();
    drawLabels(this);
  }
}

class sampledInputPanel extends Panel{
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name="Sampled Signal";
  }

  drawPanel(){
    drawDiscreteSignal(this,this.settings.downsampled)
  }
}

class sampledInputFreqPanel extends freqPanel{
  constructor(){ super(); this.name = "Sampled Signal FFT";}

  drawPanel(){
    this.bufferInit();
    let base = this.buffer.height-this.bezel;
    let numPeaks = this.settings.downsamplingFactor/2;

    for (let peak = 0;peak<=numPeaks;peak++){
      let color= getColor(peak);
      this.buffer.stroke(color); this.buffer.fill(color);
      let effectiveWidth =this.buffer.width-2*this.bezel;
      let xpos = peak/numPeaks*(effectiveWidth)+this.bezel;
      this.drawPeak(xpos,this.buffer.height-this.bezel*2,base,color);

      for (let harm = 1; harm <= this.settings.numHarm; harm++) {
        let xNegative = xpos - this.settings.fundFreq
                                / (this.settings.sampleRate/2) * harm * (effectiveWidth);
                                if (xNegative <this.bezel){xNegative = this.bezel+(this.bezel-xNegative)} //Reflect at 0. TODO should technically use a new color.
        let xPositive = xpos + this.settings.fundFreq
                                / (this.settings.sampleRate/2) * harm * (effectiveWidth);
                                if (xPositive >this.buffer.width-this.bezel){xPositive = (this.buffer.width-this.bezel)+
                                                                        (this.buffer.width-this.bezel-xPositive)}//Reflect at FS. TODO should also use a new color

        let ypos = this.buffer.height-this.bezel;
        this.drawPeak(xPositive,this.settings.amplitude*(this.buffer.height-this.bezel*2)/harm,base,color);
        this.drawPeak(xNegative,this.settings.amplitude*(this.buffer.height-this.bezel*2)/harm,base,color);
      }
    this.drawBorder();
    drawLabels(this);
  }
}
}

class sliderPanel extends Panel{
  drawPanel(){
  }
}
class quantNoisePanel extends Panel{
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name ="Quantization Noise";
  }
  drawPanel(){
    drawDiscreteSignal(this, this.settings.quantNoise);
  }
}
class quantNoiseFreqPanel extends Panel{
  constructor(){
    super()
    this.name ="Quantization Noise FFT";
    this.ellipseSize=2;
    this.xAxis = "Frequency";
  }
  drawPanel(){
    drawFFT(this, this.settings.quantNoiseFreq);
    drawLabels(this);
  }
}
