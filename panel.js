//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(background = "white", stroke = "black", strokeWeight = 1, fill = "black") {
    this.background =  background;
    this.stroke = stroke;
    this.strokeWeight = strokeWeight;
    this.fill = fill;
    this.xAxis= "Time";
    this.yAxis = "Amp";
    this.tickTextSize = 9;
    this.numTimeTicks = 8;
    this.numFreqTicks = 8;
  }

  setup(p, height, width, settings) {
    this.settings = settings;
    this.buffer = p.createGraphics(1,1);
    this.resize(height, width);
    this.bufferInit();
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
    this.buffer.stroke(this.stroke);
    this.buffer.line(this.plotLeft, this.plotTop, this.plotLeft, this.plotBottom);
    this.buffer.line(this.plotLeft, this.plotTop, this.plotRight, this.plotTop);
    this.buffer.line(this.plotRight, this.plotTop, this.plotRight, this.plotBottom);
    this.buffer.line(this.plotLeft, this.plotBottom, this.plotRight, this.plotBottom);
  }

  drawPanel(){}
}

class freqPanel extends Panel{
  constructor(){ super(); this.xAxis = "Frequency";
  }

  drawPeak(x,height,base,colour="black"){
    this.buffer.fill(colour); 
    this.buffer.stroke(colour);
    this.buffer.beginShape();
    if (x<this.plotLeft || x>this.plotRight) return;
    let x1=x-2; let x2 = x+2;
    x1 = Math.max(x1, this.plotLeft);
    x2 = Math.min(x2, this.plotRight);
    this.buffer.vertex(x1, base);
    this.buffer.vertex(x, this.plotBottom-height);
    this.buffer.vertex(x2, base);
    this.buffer.vertex(x, base);
    this.buffer.endShape();
    this.buffer.stroke(this.stroke); this.buffer.fill(this.fill);
  }
}

const log10 = Math.log(10);

function atodb(a, a_0 = 1)
{
  return 20 * Math.log(a / a_0) / log10;
}

function drawMidLine(panel) {
  panel.buffer.drawingContext.setLineDash([5,5]);
  panel.buffer.line(panel.plotLeft, panel.halfh, panel.plotRight, panel.halfh);
  panel.buffer.drawingContext.setLineDash([]);
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
    panel.drawStem(xpos,ypos,panel.halfh);
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

function drawFreqTicks(panel, num_ticks, pixels_per_hz) {
  let hz_per_pixel = 1/pixels_per_hz;
  let tick_jump = Math.floor((panel.plotWidth) / num_ticks);
  for (let i = 0; i < num_ticks; ++i) {
    let x = i * tick_jump;
    let text = (x * hz_per_pixel).toFixed(0) + ' hz';
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

function getColor(num){
  return [num*666%255,num*69%255,num*420%255]
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
    let base = this.plotBottom;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    drawPassBand(this);

    for (let x = 1; x <= this.settings.numHarm; x++) {
      let hz = this.settings.fundFreq * x;
      let xpos = hz * pixels_per_hz + this.plotLeft;
      if (xpos > this.plotRight) break;
      let height = this.settings.amplitude * this.plotHeight / x;
      this.drawPeak(xpos, height, base)
    }

    this.drawBorder();
    drawFreqTicks(this, this.numFreqTicks, pixels_per_hz);
    drawName(this);
  }

}

function magnitude(real, cplx) {
  return Math.sqrt(real * real + cplx * cplx);
}

function drawFFT(panel, fft) {
  let gain = panel.plotHeight;
  let offset = 100;
  let hz_per_bin = panel.settings.sampleRate / (fft.length / 2);
  // fft.length / 2 because it is an interleaved complex array
  // with twice as many elements as it has (complex) numbers
  let pixels_per_hz = panel.plotWidth / panel.settings.maxVisibleFrequency;
  let pixels_per_bin = pixels_per_hz * hz_per_bin;
  let num_bins = Math.round(panel.plotWidth / pixels_per_bin);
  let normalize = 4/fft.length;

  panel.buffer.background(panel.background);
  drawPassBand(panel);
  panel.buffer.beginShape();
  panel.buffer.vertex(panel.plotLeft, panel.plotBottom);
  for (let bin = 0; bin <= num_bins; bin++) {
    let xpos = pixels_per_bin * bin + panel.plotLeft;
    let ypos = panel.plotBottom - panel.plotHeight * normalize * magnitude(fft[2*bin], fft[2*bin+1]);
    panel.buffer.vertex(xpos, ypos);
  }
  panel.buffer.vertex(panel.plotRight, panel.plotBottom);
  panel.buffer.endShape(panel.buffer.CLOSE);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.stroke(panel.stroke);
  panel.drawBorder();
  drawFreqTicks(panel, panel.numFreqTicks, pixels_per_hz);
  drawName(panel);
}

class inputSigFFTPanel extends freqPanel {
  constructor(){super(); this.name = "Input Signal FFT";}

  drawPanel() {
    drawFFT(this, this.settings.originalFreq);
  }
}

class sampledSigFFTPanel extends freqPanel {
  constructor(){super(); this.name="Reconstructed Signal FFT";}
  drawPanel() {
    drawFFT(this, this.settings.reconstructedFreq);
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
      this.drawStem(xpos,ytop,base);
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
    this.bufferInit();
    let base = this.plotBottom;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let numPeaks = Math.round(this.settings.maxVisibleFrequency / sampleRate);

    for (let peak = 0; peak <= numPeaks; peak++) {
      let hz = peak * this.settings.sampleRate / this.settings.downsamplingFactor;
      let xpos  = hz * pixels_per_hz + this.plotLeft;
      let color = getColor(peak);
      this.drawPeak(xpos, this.plotHeight, base, color)
      let text = peak.toFixed(0) + ' FS';
      drawVerticalTick(this, text, xpos);
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

function drawPassBand(panel) {
  let sampleRate = panel.settings.sampleRate/panel.settings.downsamplingFactor;
  let pixels_per_hz = panel.plotWidth / panel.settings.maxVisibleFrequency;
  panel.buffer.strokeWeight(0);
  panel.buffer.fill(235);
  let passbandcutoff = sampleRate/2;
  let passbandpixelwidth = passbandcutoff * pixels_per_hz;
  panel.buffer.rect(panel.plotLeft, panel.plotTop, passbandpixelwidth, panel.plotHeight);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.fill(panel.fill);
}

class sampledInputFreqPanel extends freqPanel{
  constructor(){ super(); this.name = "Sampled Signal Frequency Domain";}

  drawPanel(){
    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    let base = this.plotBottom;
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let numPeaks = Math.round(this.settings.maxVisibleFrequency / sampleRate);

    drawPassBand(this);

    for (let peak = 0; peak <= numPeaks; peak++) {
      let color = getColor(peak);
      let peakhz = peak * sampleRate;
      let xpos = peakhz * pixels_per_hz + this.plotLeft;
      this.buffer.stroke(color);
      this.buffer.drawingContext.setLineDash([5,5]);
      this.buffer.line(xpos, this.plotTop, xpos, this.plotBottom);
      // does the sampled signal actually have amplitude at the sampling frequency? 
      // If so, revert this dashed line to a drawPeak
      this.buffer.drawingContext.setLineDash([]);
      let fstext = peak.toFixed(0) + ' FS';
      let nyquisttext = (peak - 1).toFixed(0) + '.5 FS';
      let nyquistxpos = (peakhz - sampleRate/2) * pixels_per_hz + this.plotLeft;
      drawVerticalTick(this, fstext, xpos);
      drawVerticalTick(this, nyquisttext, nyquistxpos);

      for (let harm = 1; harm <= this.settings.numHarm; harm++) {
        let hzNegative = peakhz - (this.settings.fundFreq * harm);
        let hzPositive = peakhz + (this.settings.fundFreq * harm);
        if (hzNegative < 0) hzNegative = 0 + (0 - hzNegative); //Reflect at 0. TODO should technically use a new color.
        // don't reflect at sampleRate because we are already drawing the negative frequency images

        let positiveHeight = this.settings.amplitude*this.plotHeight/harm;
        let negativeHeight = this.settings.amplitude*this.plotHeight/harm;
        let xNegative = hzNegative * pixels_per_hz + this.plotLeft;
        let xPositive = hzPositive * pixels_per_hz + this.plotLeft;
        if (xNegative < this.plotRight) this.drawPeak(xNegative, negativeHeight, base, color);
        if (xPositive < this.plotRight) this.drawPeak(xPositive, positiveHeight, base, color);
      }
    }
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
