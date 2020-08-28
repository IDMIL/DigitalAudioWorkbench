//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 1, fill = "black") {
    this.background =  background;
    this.stroke = stroke;
    this.strokeWeight = strokeWeight;
    this.fill = fill;
    this.strokeClr = ["black",[28,48,65],'#B2ABF2',"blue","green"];//TODO - update these to less ugly colours
    this.xAxis= "Time";
    this.yAxis = "Amp";
    this.tickTextSize = 9;
    this.numTimeTicks = 8;
  }

  setup(p, height, width, settings) {
    this.settings = settings;
    this.buffer = p.createGraphics(1,1);
    this.resize(height, width);
    this.buffer.strokeWeight(this.strokeWeight);
    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    this.buffer.fill(this.fill);
    this.buffer.textFont('Helvetica',20);
    this.buffer.textAlign(p.CENTER);

  }

  resize(h, w) {
    this.buffer.resizeCanvas(w, h);
    this.xbezel = Math.max(70, w * 0.1);
    this.xbezelLeft  = 0.75 * this.xbezel;
    this.xbezelRight = 0.25 * this.xbezel;
    this.ybezel = Math.max(20, h * 0.1);
    this.halfh = h/2;
    this.plotHeight = h - 2 * this.ybezel;
    this.plotWidth = w - this.xbezel;
    this.plotLeft = this.xbezelLeft; // the x coord. of the left side of the plot
    this.plotRight = w - this.xbezelRight; // ditto of the right side of the plot
    this.plotTop = this.ybezel; // y coord. of top
    this.plotBottom = h - this.ybezel; // y coord. of bottom
  }

  setbackground(backgroundClr){ this.background = backgroundClr; }
  setStroke(strokeClr){ this.stroke = strokeClr; }
  setStrokeWeight(strokeWgt){ this.strokeWeight = strokeWgt; }
  setFill(fillClr){ this.fill = fillClr; }

  drawBorder(){
    this.buffer.line(this.plotLeft, this.plotTop, this.plotLeft, this.plotBottom);
    this.buffer.line(this.plotLeft, this.plotTop, this.plotRight, this.plotTop);
    this.buffer.line(this.plotRight, this.plotTop, this.plotRight, this.plotBottom);
    this.buffer.line(this.plotLeft, this.plotBottom, this.plotRight, this.plotBottom);
  }
  drawPanel(){ }

}

class freqPanel extends Panel{
  constructor(){ super(); this.xAxis = "Frequency";
  }
}

const log10 = Math.log(10);

function atodb(a, a_0 = 1)
{
  return 20 * Math.log(a / a_0) / log10;
}

function drawMidLine(panel) {
  panel.buffer.line(panel.plotLeft, panel.halfh, panel.plotRight, panel.halfh);
}

function drawSignal(panel, signal, zoom = 1)
{
  let pixel_max = panel.plotHeight/2;
  let pixel_per_fullscale = pixel_max * zoom;
  panel.buffer.noFill();
  panel.buffer.background(panel.background);
  panel.buffer.beginShape();
  for (let x = 0; x < panel.plotWidth; x++) {
    let pixel_amp = pixel_per_fullscale * signal[x];
    let y = panel.halfh - pixel_amp;
    panel.buffer.curveVertex(x + panel.plotLeft, y);
  }
  panel.buffer.endShape();
  drawMidLine(panel);

  drawName(panel);
  drawSignalAmplitudeTicks(panel, pixel_max, 4);
  drawTimeTicks(panel, panel.numTimeTicks, 1/panel.settings.sampleRate);
  panel.drawBorder();
}

function drawDiscreteSignal(panel,signal){
  let gain = panel.plotHeight/2;
  panel.buffer.background(panel.background);
  panel.drawBorder();
  drawMidLine(panel);
  let visibleSamples = Math.round(panel.plotWidth / panel.settings.downsamplingFactor);
  for (let x = 0; x < visibleSamples; x++) {
    let xpos = Math.round(panel.plotLeft + x * panel.settings.downsamplingFactor);
    let ypos = panel.halfh - gain * signal[x];
    panel.buffer.line(xpos, panel.halfh, xpos, ypos);
    panel.buffer.ellipse(xpos, ypos, panel.ellipseSize);
  }
  drawSignalAmplitudeTicks(panel, gain, 4);
  drawTimeTicks(panel, panel.numTimeTicks, 1/(panel.settings.sampleRate));
  drawName(panel);
}

function drawHorizontalTick(panel, text, height, tick_length = 5) {
  panel.buffer.fill(panel.fill);
  panel.buffer.textFont('Helvetica', panel.tickTextSize);
  panel.buffer.textAlign(panel.buffer.RIGHT);
  panel.buffer.textStyle(panel.buffer.ITALIC);
  panel.buffer.strokeWeight(0);
  panel.buffer.text(text, 0, height - panel.tickTextSize/2, panel.plotLeft - tick_length, height + panel.tickTextSize/2);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.line(panel.plotLeft - tick_length, height, 
                    panel.plotLeft,               height);
}

function drawVerticalTick(panel, text, x, tick_length = 5) {
  panel.buffer.fill(panel.fill);
  panel.buffer.textFont('Helvetica', panel.tickTextSize);
  panel.buffer.textAlign(panel.buffer.CENTER);
  panel.buffer.textStyle(panel.buffer.ITALIC);
  panel.buffer.strokeWeight(0);
  // we draw the text in the center of an oversized box centered over the tick
  // 20000 pixels should be more than enough for any reasonable tick text
  panel.buffer.text(text, x - 10000, panel.plotBottom + tick_length, 20000, panel.ybezel - tick_length);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.line(x, panel.plotBottom, x, panel.plotBottom + tick_length);
}

function drawSignalAmplitudeTicks(panel, pixel_max, num_ticks) {
  for (let i = 1; i <= num_ticks; ++i) {
    let tick_amp_pixels = i * pixel_max / num_ticks;
    let tick_amp_db = atodb(tick_amp_pixels, pixel_max);
    drawHorizontalTick(panel, tick_amp_db.toFixed(1) + ' dB', panel.halfh - tick_amp_pixels);
    drawHorizontalTick(panel, tick_amp_db.toFixed(1) + ' dB', panel.halfh + tick_amp_pixels);
  }
  drawHorizontalTick(panel, '-inf dB', panel.halfh);
}

function drawTimeTicks(panel, num_ticks, seconds_per_pixel) {
  let tick_jump = Math.floor((panel.plotWidth) / num_ticks);
  for (let i = 0; i < num_ticks; ++i) {
    let x = i * tick_jump;
    let text = (x * seconds_per_pixel * 1000).toFixed(1) + ' ms';
    drawVerticalTick(panel, text, x + panel.plotLeft);
  }
}

function drawName(panel){
  panel.buffer.fill(panel.fill);
  panel.buffer.strokeWeight(0);
  panel.buffer.textAlign(panel.buffer.CENTER);
  panel.buffer.textStyle(panel.buffer.NORMAL);
  panel.buffer.textFont('Helvetica',15);
  let textheight = panel.buffer.textSize() + panel.buffer.textDescent() + 1;
  panel.buffer.text (panel.name, panel.plotLeft, panel.plotTop - textheight, panel.plotWidth, panel.ybezel);
  panel.buffer.strokeWeight(panel.strokeWeight);
}

class inputSigPanel extends Panel {
  constructor(){super(); this.name="Input Signal"}

  drawPanel(){
    drawSignal(this, this.settings.original);
  }
}

class reconstructedSigPanel extends Panel {
  constructor(){super(); this.name="Reconstructed Signal";};

  drawPanel(){
    drawSignal(this, this.settings.reconstructed);
  }
}

class inputSigFreqPanel extends freqPanel {
  constructor(){super(); this.name="Input Signal Frequency Domain";}
  drawPanel(){
    this.buffer.background(this.background);
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let max_freq = sampleRate * this.settings.frequencyZoom;
    let pixels_per_hz = this.plotWidth / max_freq;

    for (let harmonic = 1; harmonic <= this.settings.numHarm; harmonic++) {
      let freq = this.settings.fundFreq * harmonic;
      let i = 0;
      while (freq + i * sampleRate < max_freq) {
        let xpositive = (freq + i * sampleRate) * pixels_per_hz + this.plotLeft;
        let y = this.plotBottom - (this.plotHeight * this.settings.amplitude / harmonic);
        this.buffer.line(xpositive, this.plotBottom, xpositive, y);
        freq += sampleRate;
      }
    }

    this.drawBorder();
    drawName(this);
  }

}

function magnitude(real, cplx) {
  return Math.sqrt(real * real + cplx * cplx);
}

function drawFFT(panel, fft) {
  let base = panel.plotBottom;
  let gain = panel.plotHeight;
  let offset = 100;
  let normalize = 4/fft.length;
  let xscale = panel.plotWidth/(fft.length/2);
  panel.buffer.background(panel.background);
  panel.buffer.strokeWeight(1);
  panel.buffer.stroke(panel.strokeClr[0]);
  panel.buffer.fill(panel.stroke);

  panel.buffer.beginShape();
  panel.buffer.vertex(panel.plotLeft, base);
  // fft.length / 2 because it is an interleaved complex array
  // with twice as many elements as it has (complex) numbers
  for (let x = 0; x <= fft.length/2; x++) {
    let xpos = xscale*x + panel.plotLeft;
    let ypos = base - gain * normalize * magnitude(fft[2*x], fft[2*x+1]);
    panel.buffer.vertex(xpos, ypos);
  }
  panel.buffer.vertex(panel.plotRight, base);
  panel.buffer.endShape(panel.buffer.CLOSE);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.stroke(panel.stroke);
  panel.drawBorder();
  drawName(panel);
}

class inputSigFFTPanel extends freqPanel {
  constructor(){super(); this.name = "Input Signal FFT";}
  drawPanel() {
    drawFFT(this, this.settings.originalFreq);
    drawName(this);

  }
}

class sampledSigFFTPanel extends freqPanel {
  constructor(){super(); this.name="Reconstructed Signal FFT";}
  drawPanel() {
    drawFFT(this, this.settings.reconstructedFreq);
    drawName(this);
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
    let base = this.plotBottom;
    let ytop = this.plotTop + 10;
    this.buffer.background(this.background);
    this.drawBorder();

    let visibleSamples = Math.round(this.plotWidth / this.settings.downsamplingFactor);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = this.plotLeft + x * this.settings.downsamplingFactor;
      this.buffer.line(xpos, base, xpos, ytop);
      this.buffer.ellipse(xpos, ytop, this.ellipseSize);
    }

    drawHorizontalTick(this, '0.0 dB', ytop);
    drawHorizontalTick(this, '-inf dB', base);
    drawTimeTicks(this, this.numTimeTicks, 1/(this.settings.sampleRate));
    drawName(this);
  }
}

class impulseFreqPanel extends freqPanel {
  constructor(){super(); this.name="Sampling Signal Frequency Domain";}
  drawPanel(){
    this.buffer.background(this.background);
    this.buffer.fill(this.fill); this.buffer.strokeWeight(this.strokeWeight);

    for (let x = 0; x <= 4; x++) {
      let xpos = this.settings.sampleRate / 20000 * x * this.buffer.width/2+1+this.ybezel;
      this.buffer.line(xpos, this.buffer.height *  .75, xpos, this.buffer.height / 4);
      if (x > 0) {
        this.buffer.text((x) + "FS", xpos-10, this.buffer.height - this.ybezel*2)
      }
    }
    this.drawBorder();
    drawName(this);
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
  constructor(){ super(); this.name = "Sampled Signal Frequency Domain";}

  drawPanel(){
//    let ypos = this.buffer.height * .75;
//    this.buffer.background(this.background);
//
//    for (let x = 0; x <= 4; x++) {
//      let xpos = this.settings.sampleRate / 20000 * x * (this.buffer.width) / 2;
//      this.buffer.stroke(this.strokeClr[x]);
//      if ((xpos < this.buffer.width-this.bezel*2) &(xpos > this.bezel)){
//        this.buffer.line(xpos+this.bezel, ypos, xpos+this.bezel, this.buffer.height  / 8);
//        this.buffer.line(xpos+this.bezel, this.buffer.height / 8, xpos+this.bezel, this.buffer.height / 8);
//        this.buffer.text((x) + "FS", xpos+this.bezel-10, this.buffer.height - this.bezel*2)
//
//      }
//
//    //Draw harmonics
//      for (let harm = 1; harm <= this.settings.numHarm; harm++) {
//        let xPositive = xpos + this.settings.fundFreq * harm * this.buffer.width / 2 / 20000+this.bezel;
//        let xNegative = xpos - this.settings.fundFreq * harm * this.buffer.width / 2 / 20000+this.bezel;
//        let yEnd = ypos * (1 - this.settings.amplitude * .6 / harm);
//        if ((xPositive > this.bezel) & (xPositive < this.buffer.width-this.bezel)){
//          this.buffer.line(xPositive, ypos, xPositive, yEnd);
//        }
//        if ((xNegative > this.bezel) & (xNegative < this.buffer.width-this.bezel)){
//        this.buffer.line(xNegative, ypos, xNegative, yEnd);
//      }
//      }
//
//    }
//    this.buffer.stroke(this.stroke);
//    this.buffer.line(this.bezel, ypos, this.buffer.width-this.bezel, ypos);
    this.drawBorder();
    drawName(this);
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
  }
}
