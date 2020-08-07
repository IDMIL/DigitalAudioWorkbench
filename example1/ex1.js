function new_widget(/* future args, e.g. en/dis-able panes */) { const sketch = p => {

var inputSigBuffer, inputSigFreqBuffer, waveBuffer, impulseBuffer, impFreqBuffer, sampFreqBuffer, sliderBuffer;
let freqSlider, sampleRateSlider, ampSlider, bitDepthSlider;

var totalHeight = 600; //canvas height
var totalWidth = 900; //canvas width
var numPanels = 5;
let panelWidth = totalWidth / 2;;
let panelHeight = totalHeight / numPanels;
const HALF_PANEL_HEIGHT = panelHeight / 2;

let phaseOffset = 3.1415 / 2;
let phaseOffsetIncrement = 0.0; // Not used
let amplitude = 1.0;
let fundamentalFrequency = 200;
let phaseIncrement;
let sampleRate = 20000;
const numHarm = 2; // number of harmonics in signal
let yvalues; // Using an array to store height values for the wave
let imagePeriod = sampleRate / totalWidth; // How many pixels before the wave repeats

let bitDepth;
const BIT_DEPTH_MAX = 16;

p.setup = function () {

  p.createCanvas(totalWidth, totalHeight);
  phaseIncrement = (p.TWO_PI * fundamentalFrequency / 20000 / imagePeriod) //* xspacing;
  yvalues = new Array(p.floor(panelWidth)); // xspacing));
  // Create all of your off-screen graphics buffers
  inputSigBuffer = p.createGraphics(panelWidth, panelHeight);
  inputSigFreqBuffer = p.createGraphics(panelWidth, panelHeight);
  waveBuffer = p.createGraphics(panelWidth, panelHeight);
  impulseBuffer = p.createGraphics(panelWidth, panelHeight);
  sliderBuffer = p.createGraphics(p.width, panelHeight);
  impFreqBuffer = p.createGraphics(panelWidth, panelHeight);
  sampFreqBuffer = p.createGraphics(panelWidth, panelHeight);

  inputSigBuffer.strokeWeight(3); // Thicker
  inputSigFreqBuffer.strokeWeight(3); // Thicker
  waveBuffer.strokeWeight(3); // Thicker
  impulseBuffer.strokeWeight(3); // Thicker
  impFreqBuffer.strokeWeight(3); // Thicker
  sampFreqBuffer.strokeWeight(3); // Thicker

  sliderSetup();
  // osc = new p5.Oscillator('sine');
  // osc.fundamentalFrequency(fundamentalFrequency, 0.1);
  // osc.amp(amplitude, 0.1);
  // osc.start();
  updateGraphics();

}

p.draw = function() {

  // Paint the off-screen buffers onto the main canvas
  p.image(waveBuffer, 0, 0);
  p.image(impulseBuffer, 0, p.height / numPanels);
  p.image(inputSigBuffer, 0, p.height / numPanels * 2);
  p.image(waveBuffer, 0, p.height / numPanels * 3); // "reconstructed signal"
  p.image(inputSigFreqBuffer, panelWidth, 0);
  p.image(impFreqBuffer, panelWidth, p.height / numPanels);
  p.image(sampFreqBuffer, panelWidth, p.height / numPanels * 2);
  p.image(sliderBuffer, 0, p.height / 2);

  //Update the audio parameters
  //osc.fundamentalFrequency(fundamentalFrequency, 0.1);
  // osc.amp(amplitude * .95, 0.1);
}

function sliderSetup() {
  freqSlider = p.createSlider(200, sampleRate / 8, 1250);
  freqSlider.position(10, p.height - p.height / numPanels + 10);
  freqSlider.style('width', '200px');
  freqSlider.input(updateGraphics);

  freqDisplayer = p.createP()
  freqDisplayer.position(freqSlider.x * 2 + freqSlider.width, p.height - p.height / numPanels - 5);
  ampSlider = p.createSlider(0.0, 1.0, 1.0, .01);
  ampSlider.position(10, p.height - p.height / numPanels + 50);
  ampSlider.style('width', '200px');
  ampSlider.input(updateGraphics);

  ampDisplayer = p.createP()
  ampDisplayer.position(ampSlider.x * 2 + ampSlider.width, p.height - p.height / numPanels + 35);
  ampSlider.input(updateGraphics);

  // bitDepthSlider = p.createSlider(1, BIT_DEPTH_MAX, BIT_DEPTH_MAX, 1);
  // bitDepthSlider.position(10, p.height - p.height / numPanels + 100);
  // bitDepthSlider.style('width', '200px');
  // bitDepthDisplayer = createP()
  // bitDepthDisplayer.position(bitDepthSlider.x * 2 + bitDepthSlider.width, p.height - p.height / numPanels + 85);
  // bitDepthSlider.input(updateGraphics);

  sampleRateSlider = p.createSlider(10000, 20000, 20000);
  sampleRateSlider.position(p.width / 2 + 10, p.height - p.height / numPanels + 10);
  sampleRateSlider.style('width', '200px');
  sampleRateSlider.input(updateGraphics);

  sampleRateDisplayer = p.createP()
  sampleRateDisplayer.position(sampleRateSlider.x + sampleRateSlider.width * 1.1, p.height - p.height / numPanels);
}

function updateGraphics() {
  drawSliderBuffer();
  drawWaveBuffer();
  drawImpulseBuffer();
  drawSampledBuffer();
  drawFreqBuffer();
  drawImpFreqBuffer();
  drawSampFreqBuffer();
}

function calcWave(quantize = false) {
  // if phaseOffsetIncrement is not 0.0, the waveform will scroll gradually
  phaseOffset += phaseOffsetIncrement;
  let max = p.pow(2, bitDepth - 1);
  // For every x value, calculate a y value with sine function
  let phase = phaseOffset;
  for (let i = 0; i < yvalues.length; i++) {
    yvalues[i] = 0;
    for (let harmonic = 1; harmonic <= numHarm; harmonic++) {
      yvalues[i] += p.sin(phase * harmonic) / harmonic;
    }
    // scale height < 1 because of multiple harmonics
    yvalues[i] *= .66 * amplitude;
    // if (quantize == true) {
    //   if (bitDepth >= BIT_DEPTH_MAX) {
    //     //  do no quantization
    //   } else {
    //     //   scale to max value
    //     yvalues[i] = (p.floor((yvalues[i]) * max + 0.5)) / max;
    //   }
    // }
    //Scale to window size with a little bit of a buffer for max amp
    yvalues[i] *= -p.height / numPanels / 2.2;

    phase += phaseIncrement;
  }
}


function renderContWave() {
  waveBuffer.line(0, HALF_PANEL_HEIGHT, p.width / 2, HALF_PANEL_HEIGHT);
  for (let x = 0; x < yvalues.length; x++) {
    waveBuffer.line(x - 1, yvalues[x - 1] + HALF_PANEL_HEIGHT, x, yvalues[x] + HALF_PANEL_HEIGHT);
    waveBuffer.ellipse(x, HALF_PANEL_HEIGHT + yvalues[x], 1, 1);
  }
}

function drawSampledBuffer() {

  inputSigBuffer.background("black");
  inputSigBuffer.fill("white");
  inputSigBuffer.stroke(255, 125, 125);
  inputSigBuffer.line(0, HALF_PANEL_HEIGHT, p.width, HALF_PANEL_HEIGHT);
  //calcWave();
  for (let x = 0; x < panelWidth / imagePeriod; x++) {
    let xpos = p.round(x * 20000 / sampleRate * imagePeriod);
    inputSigBuffer.line(xpos, HALF_PANEL_HEIGHT, xpos, yvalues[xpos] + HALF_PANEL_HEIGHT);
    inputSigBuffer.ellipse(xpos, yvalues[xpos] + HALF_PANEL_HEIGHT, 10);
  }
}

function drawImpulseBuffer() {
  impulseBuffer.background("black");
  impulseBuffer.fill("white");
  impulseBuffer.stroke(255, 125, 125);
  impulseBuffer.line(0, p.height / numPanels * .75, p.width, p.height / numPanels * .75);

  for (let x = 0; x < panelWidth / imagePeriod; x++) {
    let xpos = x * 20000 / sampleRate * imagePeriod;
    impulseBuffer.line(xpos, p.height / numPanels * .75, xpos, p.height / numPanels / 4);
    impulseBuffer.ellipse(xpos, p.height / numPanels / 4, 10, 10);
  }
}

function drawWaveBuffer() {
  waveBuffer.background("black");
  waveBuffer.stroke(255, 125, 125);
  waveBuffer.line(0, HALF_PANEL_HEIGHT, p.width, HALF_PANEL_HEIGHT);
  calcWave();
  renderContWave();
}

function drawFreqBuffer() {
  inputSigFreqBuffer.background(255, 125, 125);
  inputSigFreqBuffer.stroke(0, 0, 0);
  inputSigFreqBuffer.line(0, HALF_PANEL_HEIGHT, p.width, HALF_PANEL_HEIGHT);
  inputSigFreqBuffer.line(600, 0, 1200, 100);
  let ypos = HALF_PANEL_HEIGHT;

  for (let x = 1; x <= numHarm; x++) {
    let xpos = fundamentalFrequency / 20000 * x * panelWidth / 2 - 1;
    inputSigFreqBuffer.line(xpos, HALF_PANEL_HEIGHT, xpos, ypos * (1 - amplitude * .8 / x));
  }
  let xpos = sampleRate / 20000 * panelWidth / 4;

  inputSigFreqBuffer.line(0, ypos * .1, xpos, ypos * .1)
  inputSigFreqBuffer.line(xpos, ypos * .1, xpos + 1, ypos)
}

function drawImpFreqBuffer() {
  impFreqBuffer.background(255, 125, 125);
  impFreqBuffer.fill("white");
  impFreqBuffer.stroke("black");
  impFreqBuffer.line(0, p.height / numPanels * .75, p.width, p.height / numPanels * .75);
  let ypos = HALF_PANEL_HEIGHT;

  for (let x = 0; x <= 4; x++) {
    let xpos = sampleRate / 20000 * x * panelWidth / 2;
    impFreqBuffer.line(xpos, p.height / numPanels * .75, xpos, p.height / numPanels / 4);
    if (x > 0) {
      impFreqBuffer.text((x) + "FS", xpos - 5, p.height / numPanels - 10)
    }
  }
}

function drawSampFreqBuffer() {
  let ypos = p.height / numPanels * .75;
  sampFreqBuffer.background(255, 125, 125);
  sampFreqBuffer.fill("white");
  sampFreqBuffer.stroke("black");
  sampFreqBuffer.line(0, ypos, p.width, ypos);

  for (let x = 0; x <= 4; x++) {
    let xpos = sampleRate / 20000 * x * panelWidth / 2;
    //Draw impulse resp
    sampFreqBuffer.line(xpos, ypos, xpos, p.height / numPanels / 8);
    sampFreqBuffer.line(xpos, p.height / numPanels / 8, xpos, p.height / numPanels / 8);
    //Draw harmonics
    for (let harm = 1; harm <= numHarm; harm++) {
      sampFreqBuffer.line(xpos + fundamentalFrequency * harm * panelWidth / 2 / 20000, ypos, xpos + fundamentalFrequency * harm * panelWidth / 2 / 20000, ypos * (1 - amplitude * .6 / harm));
      sampFreqBuffer.line(xpos - fundamentalFrequency * harm * panelWidth / 2 / 20000, ypos, xpos - fundamentalFrequency * harm * panelWidth / 2 / 20000, ypos * (1 - amplitude * .6 / harm));
    }
  }
}

function drawSliderBuffer() {
  sliderBuffer.fill(0, 0, 0);
  sliderBuffer.textSize(32);
  fundamentalFrequency = freqSlider.value();
  amplitude = ampSlider.value();
  sampleRate = sampleRateSlider.value();
  //bitDepth = bitDepthSlider.value();
  phaseIncrement = (p.TWO_PI * fundamentalFrequency / 20000 / imagePeriod) //* xspacing;
  freqDisplayer.html('Frequency: ' + freqSlider.value() + " Hz")
  ampDisplayer.html('Amplitude: ' + ampSlider.value())
  // bitDepthDisplayer.html('Bit Depth: ' + bitDepthSlider.value())
  sampleRateDisplayer.html('Sample Rate: ' + sampleRateSlider.value() / 1000 + " kHz")
}

}; return new p5(sketch); } // end function new_widget() { var sketch = p => {

const widget = new_widget();
