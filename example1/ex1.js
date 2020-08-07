function new_widget(/* future args, e.g. en/dis-able panes */) { const sketch = p => {

var inputSigBuffer, inputSigFreqBuffer, waveBuffer, impulseBuffer, impFreqBuffer, sampFreqBuffer, sliderBuffer;
var totalHeight = 600; //canvas height
var totalWidth = 900; //canvas width
var numPanels = 5; // number of "panels" high
let w = totalWidth / 2;; // Width of 1 panel
let theta = 3.1415 / 2; // Start angle at PI/2
let amplitude = 1.0; // Height of wave
let dx; // Value for incrementing x
let freq = 200; // signal fundamental freq
let sampleRate = 20000;
let period = sampleRate / totalWidth; // How many pixels before the wave repeats
let ang_vel = 0.0; // Not used
let yvalues; // Using an array to store height values for the wave
let bitDepth;
const BIT_DEPTH_MAX = 16;
const numHarm = 2; // number of harmonics in signal
const HALF_PANEL_HEIGHT = totalHeight / numPanels / 2;
let freqSlider, sampleRateSlider, ampSlider, bitDepthSlider;

p.setup = function () {

  p.createCanvas(totalWidth, totalHeight);
  dx = (p.TWO_PI * freq / 20000 / period) //* xspacing;
  yvalues = new Array(p.floor(w)); // xspacing));
  let panelHeight = totalHeight / numPanels;
  // Create all of your off-screen graphics buffers
  inputSigBuffer = p.createGraphics(w, panelHeight);
  inputSigFreqBuffer = p.createGraphics(w, panelHeight);
  waveBuffer = p.createGraphics(w, panelHeight);
  impulseBuffer = p.createGraphics(w, panelHeight);
  sliderBuffer = p.createGraphics(totalWidth, panelHeight);
  impFreqBuffer = p.createGraphics(w, panelHeight);
  sampFreqBuffer = p.createGraphics(w, panelHeight);

  inputSigBuffer.strokeWeight(3); // Thicker
  inputSigFreqBuffer.strokeWeight(3); // Thicker
  waveBuffer.strokeWeight(3); // Thicker
  impulseBuffer.strokeWeight(3); // Thicker
  impFreqBuffer.strokeWeight(3); // Thicker
  sampFreqBuffer.strokeWeight(3); // Thicker

  sliderSetup();
  // osc = new p5.Oscillator('sine');
  // osc.freq(freq, 0.1);
  // osc.amp(amplitude, 0.1);
  // osc.start();
  updateGraphics();

}

p.draw = function() {

  // Paint the off-screen buffers onto the main canvas
  p.image(waveBuffer, 0, 0);
  p.image(impulseBuffer, 0, totalHeight / numPanels);
  p.image(inputSigBuffer, 0, totalHeight / numPanels * 2);
  p.image(waveBuffer, 0, totalHeight / numPanels * 3); // "reconstructed signal"
  p.image(inputSigFreqBuffer, w, 0);
  p.image(impFreqBuffer, w, totalHeight / numPanels);
  p.image(sampFreqBuffer, w, totalHeight / numPanels * 2);
  p.image(sliderBuffer, 0, totalHeight / 2);

  //Update the audio parameters
  //osc.freq(freq, 0.1);
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
  sampleRateSlider.position(totalWidth / 2 + 10, p.height - p.height / numPanels + 10);
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
  // Increment theta (try different values for
  // 'angular velocity' here)
  theta += ang_vel;
  let max = p.pow(2, bitDepth - 1);
  // For every x value, calculate a y value with sine function
  let x = theta;
  for (let i = 0; i < yvalues.length; i++) {
    yvalues[i] = 0;
    for (let j = 1; j <= numHarm; j++) {
      yvalues[i] += p.sin(x * j) / j // + sin(j * x) / j + sin(5 * x) / 5 + sin(7 * x) / 7;
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

    x += dx;
  }
}


function renderContWave() {
  waveBuffer.line(0, HALF_PANEL_HEIGHT, totalWidth / 2, HALF_PANEL_HEIGHT);
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
  for (let x = 0; x < w / period; x++) {
    let xpos = p.round(x * 20000 / sampleRate * period);
    inputSigBuffer.line(xpos, HALF_PANEL_HEIGHT, xpos, yvalues[xpos] + HALF_PANEL_HEIGHT);
    inputSigBuffer.ellipse(xpos, yvalues[xpos] + HALF_PANEL_HEIGHT, 10);
  }
}

function drawImpulseBuffer() {
  impulseBuffer.background("black");
  impulseBuffer.fill("white");
  impulseBuffer.stroke(255, 125, 125);
  impulseBuffer.line(0, totalHeight / numPanels * .75, p.width, totalHeight / numPanels * .75);

  for (let x = 0; x < w / period; x++) {
    let xpos = x * 20000 / sampleRate * period;
    impulseBuffer.line(xpos, totalHeight / numPanels * .75, xpos, totalHeight / numPanels / 4);
    impulseBuffer.ellipse(xpos, totalHeight / numPanels / 4, 10, 10);
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
    let xpos = freq / 20000 * x * w / 2 - 1;
    inputSigFreqBuffer.line(xpos, HALF_PANEL_HEIGHT, xpos, ypos * (1 - amplitude * .8 / x));
  }
  let xpos = sampleRate / 20000 * w / 4;

  inputSigFreqBuffer.line(0, ypos * .1, xpos, ypos * .1)
  inputSigFreqBuffer.line(xpos, ypos * .1, xpos + 1, ypos)
}

function drawImpFreqBuffer() {
  impFreqBuffer.background(255, 125, 125);
  impFreqBuffer.fill("white");
  impFreqBuffer.stroke("black");
  impFreqBuffer.line(0, totalHeight / numPanels * .75, p.width, totalHeight / numPanels * .75);
  let ypos = HALF_PANEL_HEIGHT;

  for (let x = 0; x <= 4; x++) {
    let xpos = sampleRate / 20000 * x * w / 2;
    impFreqBuffer.line(xpos, totalHeight / numPanels * .75, xpos, totalHeight / numPanels / 4);
    if (x > 0) {
      impFreqBuffer.text((x) + "FS", xpos - 5, totalHeight / numPanels - 10)
    }
  }
}

function drawSampFreqBuffer() {
  let ypos = totalHeight / numPanels * .75;
  sampFreqBuffer.background(255, 125, 125);
  sampFreqBuffer.fill("white");
  sampFreqBuffer.stroke("black");
  sampFreqBuffer.line(0, ypos, p.width, ypos);

  for (let x = 0; x <= 4; x++) {
    let xpos = sampleRate / 20000 * x * w / 2;
    //Draw impulse resp
    sampFreqBuffer.line(xpos, ypos, xpos, totalHeight / numPanels / 8);
    sampFreqBuffer.line(xpos, totalHeight / numPanels / 8, xpos, totalHeight / numPanels / 8);
    //Draw harmonics
    for (let harm = 1; harm <= numHarm; harm++) {
      sampFreqBuffer.line(xpos + freq * harm * w / 2 / 20000, ypos, xpos + freq * harm * w / 2 / 20000, ypos * (1 - amplitude * .6 / harm));
      sampFreqBuffer.line(xpos - freq * harm * w / 2 / 20000, ypos, xpos - freq * harm * w / 2 / 20000, ypos * (1 - amplitude * .6 / harm));
    }
  }
}

function drawSliderBuffer() {
  sliderBuffer.fill(0, 0, 0);
  sliderBuffer.textSize(32);
  freq = freqSlider.value();
  amplitude = ampSlider.value();
  sampleRate = sampleRateSlider.value();
  //bitDepth = bitDepthSlider.value();
  dx = (p.TWO_PI * freq / 20000 / period) //* xspacing;
  freqDisplayer.html('Frequency: ' + freqSlider.value() + " Hz")
  ampDisplayer.html('Amplitude: ' + ampSlider.value())
  // bitDepthDisplayer.html('Bit Depth: ' + bitDepthSlider.value())
  sampleRateDisplayer.html('Sample Rate: ' + sampleRateSlider.value() / 1000 + " kHz")
}

}; return sketch; } // end function new_widget() { var sketch = p => {

const widget = new_widget();
new p5(widget);
