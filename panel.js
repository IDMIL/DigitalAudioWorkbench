// Canned documentation blurbs
//Panel class. should be extended with a drawPanel method
const log10 = Math.log(10);
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
    this.numFreqTicks = 4;
    this.name = "Base Panel Class";
    this.description = "This is the base class that other panels inherit from. If you  can see this and you are not reading the source code right now there is probably a problem. Please open an issue or otherwise contact the project maintainers."
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
    this.xbezelLeft  = 0.60 * this.xbezel;
    this.xbezelRight = 0.40 * this.xbezel;
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

  drawStem(x,y,startHeight,ellipseSize =this.ellipseSize){
    let actual_y = y;
    y = (y<this.plotTop)? y=this.plotTop : (y>this.plotBottom)? y= this.plotBottom : y;
    this.buffer.line(x, startHeight, x, y);
    ellipseSize= (actual_y<this.plotTop || actual_y>this.plotBottom)? 0: ellipseSize;
    this.buffer.ellipse(x, y, ellipseSize);
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
    height = Math.abs(height);
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

function linToDB(a, a_0 = 1)
{
  return 20 * Math.log(a / a_0) / log10;
}

const midline_doc='The horizontal middle line represents an amplitude of zero. ';
function drawMidLine(panel) {
  // panel.buffer.drawingContext.setLineDash([5,5]);
  panel.buffer.stroke("gray");
  panel.buffer.line(panel.plotLeft, panel.halfh, panel.plotRight, panel.halfh);
  panel.buffer.stroke(panel.stroke);
  // panel.buffer.drawingContext.setLineDash([]);
}

const time_signal_doc='Because this signal approximates a continuous analog signal in our simulation, the signal value is drawn with a simple interpolation scheme. There are currently bugs with this interpolation when zooming in (time zoom > 100%). In addition, visual aliasing may occur when viewing high frequency signals due to the limited number of pixels on the screen acting as a kind of spatial sampling process. This may appear as amplitude modulation in the plot that is not actually present in the signal. Finally, note that the amplitude of the signal is clipped to the size of the panel viewport. This visual clipping happens regardless of whether the signal itself actually exhibits clipping. ';
function drawSignal(panel, signal, zoom = 1)
{
  let pixel_max = panel.plotHeight/2;
  let pixel_per_fullscale = pixel_max * panel.settings.ampZoom;
  panel.buffer.noFill();
  //TODO: there are some artifacts here due to the way the signal is drawn, especially when zoomed in and/or large amplitude
  panel.buffer.beginShape();
  panel.buffer.curveTightness(1.0);
  for (let x = 0; x < panel.plotWidth; x++) {
    let pixel_amp = pixel_per_fullscale * signal[Math.round(x/panel.settings.timeZoom)];
    let y = panel.halfh - pixel_amp;
    y = (y<panel.plotTop)? y=panel.plotTop : (y>panel.plotBottom)? y= panel.plotBottom : y=y; panel.buffer.curveTightness(0.0);
    panel.buffer.curveVertex(x + panel.plotLeft, y);
  }
  panel.buffer.endShape();
}

const lollipop_doc='Because this signal represents the discrete time output of the analog-to-digital conversion process, it is drawn with a lollipop plot where each stem represents a single sample. ';
function drawDiscreteSignal(panel,signal){
  let gain = panel.plotHeight/2;
  let visibleSamples = Math.floor(panel.plotWidth / panel.settings.downsamplingFactor / panel.settings.timeZoom + 1);
  for (let x = 0; x < visibleSamples; x++) {
    let xpos = Math.round(panel.plotLeft + x * panel.settings.downsamplingFactor*panel.settings.timeZoom);
    let ypos = panel.halfh - gain * signal[x]*panel.settings.ampZoom;
    panel.drawStem(xpos,ypos,panel.halfh);
  }
}

function drawHorizontalTick(panel, text, height, tick_length = 5, side="left") {
  panel.buffer.fill(panel.fill);
  panel.buffer.textFont('Helvetica', panel.tickTextSize);
  panel.buffer.textStyle(panel.buffer.ITALIC);
  panel.buffer.strokeWeight(0);
  panel.buffer.textAlign(panel.buffer.RIGHT);
  let tickStart = panel.plotLeft-tick_length;
  let tickEnd = panel.plotLeft;
  if (side == "right"){
    panel.buffer.textAlign(panel.buffer.LEFT);
    tickEnd = panel.plotRight+tick_length;
    tickStart = panel.plotRight;
    panel.buffer.text(text, tickEnd+2, height - panel.tickTextSize/2, panel.buffer.width , height + panel.tickTextSize/2);
  }
  else{
    panel.buffer.text(text, 0, height - panel.tickTextSize/2, tickStart , height + panel.tickTextSize/2);

  }

  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.line(tickStart , height,
                    tickEnd,               height);
}

function drawVerticalTick(panel, text, x, tick_length = 5) {
  if (x<panel.plotLeft || x>panel.plotRight){return};
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

const freq_amp_ticks_doc='Amplitude is plotted on the y-axis. Ticks on the left label the linear amplitude where 1.0 is equal to the maximum amplitude. ';
function drawFreqAmplitudeTicks(panel, pixel_max, num_ticks) {
  for (let i = 0; i <= num_ticks; ++i) {
    let tick_amp_pixels = i * pixel_max / num_ticks / panel.settings.ampZoom;
    drawHorizontalTick(panel, (tick_amp_pixels/pixel_max).toFixed(2), panel.plotBottom - tick_amp_pixels*panel.settings.ampZoom, 5, "right");
  }
}

const amp_ticks_doc='Amplitude is plotted on the y-axis. Ticks on the left label the linear amplitude where +/- 1.0 is equal to the maximum amplitude. ';
function drawSignalAmplitudeTicks(panel, pixel_max, num_ticks) {
  for (let i = 1; i <= num_ticks; ++i) {
    let tick_amp_pixels = i * pixel_max / num_ticks / panel.settings.ampZoom;
    // let tick_amp_db = linToDB(tick_amp_pixels, pixel_max);
    drawHorizontalTick(panel, (tick_amp_pixels/pixel_max).toFixed(2), panel.halfh - tick_amp_pixels*panel.settings.ampZoom,5,"right");
    drawHorizontalTick(panel, (-tick_amp_pixels/pixel_max).toFixed(2), panel.halfh + tick_amp_pixels*panel.settings.ampZoom,5,"right");
    // drawHorizontalTick(panel, tick_amp_db.toFixed(1) + 'dBFS', panel.halfh - tick_amp_pixels*panel.settings.ampZoom,5, "right");
    // drawHorizontalTick(panel, tick_amp_db.toFixed(1) + 'dBFS', panel.halfh + tick_amp_pixels*panel.settings.ampZoom,5, "right");
  }
  // drawHorizontalTick(panel, '-inf dBFS', panel.halfh, 5, "right");
  drawHorizontalTick(panel, '0.00', panel.halfh, 5, "right");
}

const bin_amp_ticks_doc='Ticks on the right side of this plot label the numerical value assigned to a given amplitude by the simulated analog-to-digital conversion. The labels are written in hexadecimal unless the bit depth is 7 bits or lower, in which case the labels are in binary. ';
function drawSignalBinaryScaling(panel, pixel_max, num_ticks, settings) {
  let maxInt = Math.pow(2, settings.bitDepth) - 1;
  let stepSize = (settings.quantType == "midTread") ? 2 / (maxInt - 1) : 2 / maxInt;
  let numTicks = Math.min(num_ticks, maxInt + 1);
  let pixel_per_fullscale = pixel_max * panel.settings.ampZoom;

  if (settings.encType === "Floating Point") {
    let floats = new nFloat(settings.bitDepth);
    let quantVals = floats.getQuantLevels();

    if (settings.bitDepth <= 7) {
      for (let i = 0; i < quantVals.length; i++) {
        let pixel_amp = pixel_per_fullscale * quantVals[i];
        let y = panel.halfh - pixel_amp;
        
        if (y >= panel.plotTop - 0.1 && y <= panel.plotBottom + 0.1) {
          let binaryRepresentation = floats.getBinaryRepresentation(quantVals[i]);
          drawHorizontalTick(panel, binaryRepresentation, y, 5, "left");

          panel.buffer.stroke("gray");
          panel.buffer.drawingContext.setLineDash([5, 5]);
          panel.buffer.line(panel.plotLeft, y, panel.plotRight, y);
          panel.buffer.drawingContext.setLineDash([]);
        }
      }
    } else {
      // When we have more than 7 bits, we limit in terms of space, so we know which values we want (multiples of 1/8)
      for (i = -1; i <= 1; i += 0.125) {
        let pixel_amp = pixel_per_fullscale * i;
        let y = panel.halfh - pixel_amp;
        drawHorizontalTick(panel, "0x" + parseInt(floats.getBinaryRepresentation(i), 2).toString(16).padStart(4,"0"), y, 5, "left");

        panel.buffer.stroke("gray");
        panel.buffer.drawingContext.setLineDash([5, 5]);
        panel.buffer.line(panel.plotLeft, y, panel.plotRight, y);
        panel.buffer.drawingContext.setLineDash([]);
      }
    }
  } else if (settings.encType === "Fixed Point") {
    let tickScale = (maxInt + 1) / numTicks;
    let val = -1;
    let tick;
    for (tick = 0; tick < numTicks; tick++) {
      switch(settings.quantType) {
        case "midTread":
          val = stepSize * Math.floor(val / stepSize + 0.5);
          break;
        case "midRise":
          val = stepSize * (Math.floor(val / stepSize) + 0.5);
          break;
      }
      let pixel_amp = pixel_per_fullscale * val;
      let y = panel.halfh - pixel_amp;

      if (y >= panel.plotTop - 0.1 && y <= panel.plotBottom + 0.1) {
        if (maxInt<255){
          //if under 8 bits, we can write out binary values
          drawHorizontalTick(panel, (Math.round(tick * tickScale)).toString(2).padStart(settings.bitDepth, "0"), y,5,"left");
        } else {
          //draw axis labels in hex because of limited space
          drawHorizontalTick(panel, "0x" + (tick * tickScale).toString(16).padStart(4,"0"), y,5,"left");
        }
        panel.buffer.stroke("gray");
        panel.buffer.drawingContext.setLineDash([5,5]);
        panel.buffer.line(panel.plotLeft, y, panel.plotRight, y);
        panel.buffer.drawingContext.setLineDash([]);    // drawHorizontalTick(panel, tick.toString(2), y,5,"left");
      }
      val = val + stepSize * tickScale;
    }
  }
}

const time_ticks_doc='Time is plotted on the x-axis. ';
function drawTimeTicks(panel, num_ticks, seconds_per_pixel) {
  let tick_jump = Math.floor((panel.plotWidth) / num_ticks);
  for (let i = 0; i < num_ticks; ++i) {
    let x = i * tick_jump;
    let text = (x * seconds_per_pixel * 1000).toFixed(1) + ' ms';
    drawVerticalTick(panel, text, x + panel.plotLeft);
  }
}

const freq_ticks_doc='Frequency is plotted on the x-axis. ';
function drawFreqTicks(panel, num_ticks, pixels_per_hz) {
  let hz_per_pixel = 1/pixels_per_hz;
  let tick_jump = Math.floor((panel.plotWidth) / num_ticks);
  tick_jump=panel.plotWidth / num_ticks
  for (let i = 0; i < num_ticks; ++i) {
    let x = i * tick_jump;
    if (x<this.plotLeft || x>this.plotRight) return;
    let text = (x * hz_per_pixel).toFixed(0) + ' Hz';
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
  constructor(){
    super(); 
    this.name="Input Signal Time Domain";
    this.description='This is a straightforward time domain plot of the input signal before "sampling", quantization, and "reconstruction". This signal corresponds with the authentic "analog" input to the simulated analog-to-digital conversion process. ' 
      + time_signal_doc + time_ticks_doc + amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    drawSignal(this, this.settings.original);
    drawMidLine(this);
    drawName(this);
    drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class reconstructedSigPanel extends Panel {
  constructor(){
    super(); 
    this.name="Reconstructed Signal Time Domain";
    this.description='This is a straightforward time domain plot of the signal output from the simulated digital-to-analog conversion process. '
      + time_signal_doc + time_ticks_doc + amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    drawSignal(this, this.settings.reconstructed);
    drawMidLine(this);
    drawName(this);
    drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

const analytic_frequency_doc='Spikes are drawn at the appropriate frequency and amplitude based on the analytic definition of the signal determined by the frequency, number of harmonics, and harmonic amplitude scaling settings. As such, this plot should accurately reflect the frequency content of the signal without any influence of windowing or other considerations that would affect a discrete time fourier transform. Unfortunately, this approach does not reflect non-linear effects such as quantization and clipping, where applicable. ';
class inputSigFreqPanel extends freqPanel {
  constructor(){
    super(); 
    this.name="Input Signal Frequency Domain";
    this.description='This is a frequency domain representation of the simulated "continuous time" input signal. '
        + analytic_frequency_doc + freq_ticks_doc + passband_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    drawPassBand(this);
    // let harmInc = 1;
    // if (this.settings.harmType =="Odd" || this.settings.harmType == "Even"){ harmInc=2;}
    // let harmPeak = 1, harm =1, ampScale = 1;
    let harm =1;
    while (harm<=this.settings.numHarm){
      let hz = this.settings.harmonicFreqs[harm-1];
      let xpos = hz * pixels_per_hz + this.plotLeft;
      if (xpos > this.plotRight|| xpos< this.plotLeft) break;
      // if (this.settings.harmSlope == "lin") {ampScale = 1 - (harm-1)/(this.settings.numHarm)};
      // if (this.settings.harmSlope == "1/x") {ampScale = 1/harmPeak};
      let height = this.settings.ampZoom * this.settings.amplitude * this.plotHeight *this.settings.harmonicAmps[harm-1];
      this.drawPeak(xpos, height, this.plotBottom)
      harm+=1;
      // (harmPeak ==1 && this.settings.harmType != "Odd")? harmPeak++ : harmPeak +=harmInc;
    }


    this.drawBorder();
    drawFreqTicks(this, this.numFreqTicks, pixels_per_hz);
    drawFreqAmplitudeTicks(this, this.plotHeight, 9);
    drawName(this);
  }

}

function magnitude(real, cplx) {
  return Math.sqrt(real * real + cplx * cplx);
}

const fft_doc='Because the FFT is used here, there are visual artifacts introduced by the windowing process, and the frequency resolution of the plot is inherently limited by the size of the FFT. Note that the resolution is not increased when zooming in with the frequency zoom slider. ';
function drawFFT(panel, fft, tick='freq') {
  let gain = panel.plotHeight * panel.settings.ampZoom;
  let offset = 100;
  let hz_per_bin = panel.settings.sampleRate / (fft.length / 2);
  // fft.length / 2 because it is an interleaved complex array
  // with twice as many elements as it has (complex) numbers
  let pixels_per_hz = panel.plotWidth / panel.settings.maxVisibleFrequency;
  let pixels_per_bin = pixels_per_hz * hz_per_bin;
  let num_bins = Math.round(panel.plotWidth / pixels_per_bin);
  let normalize = 4/fft.length;

  panel.buffer.background(panel.background);
  panel.buffer.stroke(panel.stroke);
  drawPassBand(panel);
  panel.buffer.beginShape();
  panel.buffer.vertex(panel.plotLeft, panel.plotBottom);
  for (let bin = 0; bin <= num_bins; bin++) {
    let xpos = pixels_per_bin * bin + panel.plotLeft;
    let ypos = panel.plotBottom - gain * normalize * magnitude(fft[2*bin], fft[2*bin+1]);
    panel.buffer.vertex(xpos, ypos);
  }
  panel.buffer.vertex(panel.plotRight, panel.plotBottom);
  panel.buffer.endShape(panel.buffer.CLOSE);
  panel.buffer.strokeWeight(panel.strokeWeight);
  panel.buffer.stroke(panel.stroke);
  panel.drawBorder();
  drawName(panel);
  if (tick == 'dirac')
    drawDiracDashes(panel);
  else
    drawFreqTicks(panel, panel.numFreqTicks, pixels_per_hz);
  drawFreqAmplitudeTicks(panel, panel.plotHeight, 9);
}

class inputSigFFTPanel extends freqPanel {
  constructor(){
    super(); 
    this.name = "Input Signal FFT";
    this.description='This plot shows the FFT of the input signal. ' + fft_doc + 'This plot clearly reveals one of the compromises inherent in the simulation; since everything must be represented by the computer, the ideal continuous time input signal must be approximated by a discrete time signal with a sufficiently high sampling rate. ';
  }

  drawPanel() {
    drawFFT(this, this.settings.originalFreq);
  }
}

class sampledInputFFTPanel extends freqPanel {
  constructor(){
    super();
    this.name="Sampled Signal FFT";
    this.description='This plot shows the FFT of the signal output by the simulated analog-to-digital conversion. ' + fft_doc;
  }
  drawPanel() {
    drawFFT(this, this.settings.stuffedFreq, 'dirac');
  }
}

class reconstructedSigFFTPanel extends freqPanel {
  constructor(){
    super();
    this.name="Reconstructed Signal FFT";
    this.description='This plot shows the FFT of the signal output by the simulated digital-to-analog conversion. ' + fft_doc + 'This plot clearly reveals one of the compromises inherent in the simulation; since everything must be represented by the computer, the ideal continuous time output signal must be approximated by a discrete time signal with a sufficiently high sampling rate. ';
  }
  drawPanel() {
    drawFFT(this, this.settings.reconstructedFreq);
  }
}

class impulsePanel extends Panel {
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name = "Sampling Signal Time Domain";
    this.description = 'This is a time domain plot of the dirac comb used to sample the input signal. Before quantization, the input signal is multiplied with this dirac comb; this is the "sampling" part of the analog-to-digital conversion process. '
        + time_ticks_doc;
  }
  drawPanel(){
    let base = this.plotBottom;
    let ytop = this.plotTop + 10;
    this.buffer.background(this.background);
    this.drawBorder();

    let visibleSamples = Math.floor(this.plotWidth / this.settings.downsamplingFactor/this.settings.timeZoom+1);
    for (let x = 0; x < visibleSamples; x++) {
      let xpos = this.plotLeft + x * this.settings.downsamplingFactor*this.settings.timeZoom;
      this.drawStem(xpos,ytop,base);
    }
    //I'm not sure dBs make sense here
    // drawHorizontalTick(this, '0.0 dB', ytop);
    // drawHorizontalTick(this, '-inf dB', base);
    drawHorizontalTick(this, '1.0', ytop,5,"right");
    drawHorizontalTick(this, '0.0', base,5,"right");

    drawTimeTicks(this, this.numTimeTicks, this.settings.timeZoom/(this.settings.sampleRate));
    drawName(this);
  }
}

class impulseFreqPanel extends freqPanel {
  constructor(){
    super();
    this.name="Sampling Signal Frequency Domain";
    this.description = 'This is a frequency domain plot of the dirac comb used to sample the input signal. The sampling process causes the frequency content of the input signal to be convolved with the frequency response of the dirac comb, resulting in periodic images of the input signal frequency at mulitples of the sampling frequency. ';
  }
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
      let text = peak.toFixed(0) + ' fs';
      drawVerticalTick(this, text, xpos);
    }

    drawFreqAmplitudeTicks(this, this.plotHeight, 9);
    this.drawBorder();
    drawName(this);
  }
}

class sampledInputPanel extends Panel{
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name="Sampled Signal Time Domain";
    this.description = lollipop_doc + time_ticks_doc + amp_ticks_doc + bin_amp_ticks_doc + midline_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    drawDiscreteSignal(this, this.settings.downsampled)
    drawMidLine(this);
    drawName(this);
    drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    drawSignalBinaryScaling(this, this.plotHeight/2, 16,this.settings);

    drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

const passband_doc='The frequency range below the nyquist frequency is highlighted by a light grey background. ';
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

function calculateNumImages(settings) {
  // calculate the number of spectral images to draw so that the highest frequency
  // image's lowest negative harmonic is visible
  let sampleRate = settings.sampleRate / settings.downsamplingFactor;
  let max_harmonic = settings.harmonicFreqs[settings.harmonicFreqs.length - 1];
  let numImages = 0;
  while (numImages * sampleRate - max_harmonic < settings.maxVisibleFrequency)
    numImages++; 
  return numImages;
}

function drawDiracDashes(panel) {
  let sampleRate = panel.settings.sampleRate / panel.settings.downsamplingFactor;
  let pixels_per_hz = panel.plotWidth / panel.settings.maxVisibleFrequency;
  let numImages = calculateNumImages(panel.settings);

  for (let image = 0; image <= numImages; image++) {
    let color = getColor(image);
    let imagehz = image * sampleRate; // frequency of a dirac comb harmonic that the input spectrum is convolved with
    let xpos = imagehz * pixels_per_hz + panel.plotLeft;

    // draw the dotted line associated with this dirac comb image
    panel.buffer.stroke(color);
    panel.buffer.drawingContext.setLineDash([5,5]);
    panel.buffer.line(xpos, panel.plotTop, xpos, panel.plotBottom);
    panel.buffer.drawingContext.setLineDash([]);

    // label the dotted line associated with this dirac comb image
    let fstext = imagehz.toFixed(0) + ' Hz';
    drawVerticalTick(panel, fstext, xpos);
  }
}

class sampledInputFreqPanel extends freqPanel{
  constructor(){ 
    super(); 
    this.name = "Sampled Signal Frequency Domain";
    this.description='This is a frequency domain representation of the output from the simulated analog-to-digital conversion process. ' + analytic_frequency_doc + 'Notice that periodic images of the input signal are present at multiples of the sampling frequency. These are later removed by the digital-to-analog conversion process, leaving only the frequency content below the Nyquist frequency (whether that content was present in the original signal or introduced by one of the period aliases at multiples of the sampling frequency, i.e. aliasing). '
      + freq_ticks_doc + passband_doc;
  }

  drawPanel(){
    this.buffer.background(this.background);
    this.buffer.stroke(this.stroke);
    drawPassBand(this);
    drawDiracDashes(this);

    let base = this.plotBottom;
    let sampleRate = this.settings.sampleRate / this.settings.downsamplingFactor;
    let pixels_per_hz = this.plotWidth / this.settings.maxVisibleFrequency;
    let numImages = calculateNumImages(this.settings);

    for (let image = 0; image <= numImages; image++) {

      let color = getColor(image);
      let imagehz = image * sampleRate; // frequency of a dirac comb harmonic that the input spectrum is convolved with

      for (let harm = 1; harm <= this.settings.numHarm; harm++) {

        let hzNegative = imagehz - this.settings.harmonicFreqs[harm-1];
        let hzPositive = imagehz + this.settings.harmonicFreqs[harm-1];

        if (hzNegative < 0) hzNegative = 0 + (0 - hzNegative); //Reflect at 0. TODO should technically use a new color.
        // don't reflect at sampleRate because we are already drawing the negative frequency images

        let positiveHeight = this.settings.ampZoom * this.settings.amplitude*this.plotHeight*this.settings.harmonicAmps[harm-1];
        let negativeHeight = this.settings.ampZoom * this.settings.amplitude*this.plotHeight*this.settings.harmonicAmps[harm-1];
        let xNegative = hzNegative * pixels_per_hz + this.plotLeft;
        let xPositive = hzPositive * pixels_per_hz + this.plotLeft;
        if (xNegative < this.plotRight) this.drawPeak(xNegative, negativeHeight, base, color);
        if (xPositive < this.plotRight) this.drawPeak(xPositive, positiveHeight, base, color);
      }
    }

    this.drawBorder();
    drawFreqAmplitudeTicks(this, this.plotHeight, 9);
    drawName(this);
  }
}

class quantNoisePanel extends Panel{
  constructor(){
    super()
    this.strokeWeight=1;
    this.ellipseSize=5;
    this.name ="Quantization Noise Time Domain";
    this.description = 'This plot shows the difference between the sampled signal before and after quantization, representing the error introduced by the quantization process. '
        + time_ticks_doc + amp_ticks_doc + midline_doc;
  }
  drawPanel(){
    // TODO: Floating vs fixed
    this.buffer.background(this.background);
    drawDiscreteSignal(this, this.settings.quantNoise);
    drawMidLine(this);
    drawName(this);
    drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class quantNoiseFFTPanel extends Panel{
  constructor(){
    super();
    this.name ="Quantization Noise FFT";
    this.description = 'This plot shows the frequency content of the error introduced by the quantization process. '
        + fft_doc + freq_ticks_doc + passband_doc;
    this.ellipseSize=2;
    this.xAxis = "Frequency";
  }
  drawPanel(){
    drawFFT(this, this.settings.quantNoiseFreq);
  }
}

class inputPlusSampledPanel extends Panel {
  constructor() {
    super();
    this.name = "Input with Sampled Signal Time Domain";
    this.description = 'This plot shows the input signal with the sampled signal overlayed on top. See the documentation for the input signal time domain and sampled signal time domain for more information. ';
    this.ellipseSize = 5;
  }

  drawPanel() {
    // TODO: Floating vs fixed
    this.buffer.background(this.background);
    drawDiscreteSignal(this, this.settings.downsampled);
    this.buffer.stroke("gray");
    drawSignal(this, this.settings.original);
    drawMidLine(this);
    drawName(this);
    drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    drawSignalBinaryScaling(this, this.plotHeight/2, 16,this.settings);
    drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}

class allSignalsPanel extends Panel {
  constructor() {
    super();
    this.name = "Input (solid), Sampled (lollipop), Reconstructed (dotted), Time Domain";
    this.description = 'This plot combines the input signal, sampled signal, and reconstructed signal time domain plots. See the documentation for each individual plot for more information. ';
    this.ellipseSize = 5;

  }

  drawPanel() {
    this.buffer.background(this.background);
    drawDiscreteSignal(this,this.settings.downsampled)
    drawSignal(this, this.settings.original);
    this.buffer.drawingContext.setLineDash([5,5]);
    drawSignal(this, this.settings.reconstructed);
    this.buffer.drawingContext.setLineDash([]);
    drawMidLine(this);
    drawName(this);
    drawSignalAmplitudeTicks(this, this.plotHeight/2, 4);
    drawTimeTicks(this, this.numTimeTicks/this.settings.timeZoom, 1/(this.settings.timeZoom*this.settings.sampleRate));
    this.drawBorder();
  }
}
