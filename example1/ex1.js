var signalBuffer, rightBuffer, waveBuffer, impulseBuffer, impFreqBuffer, sampFreqBuffer, sliderBuffer;
var totalHeight = 600; //canvas height
var totalWidth = 900; //canvas width
var numPanels = 5; // number of "panels" high
//let xspacing = 8; // Distance between each horizontal location
let w = totalWidth / 2;; // Width of 1 panel
let theta = 3.1415 / 2; // Start angle at PI/2
let amplitude = 1.0; // Height of wave
let dx; // Value for incrementing x
let freq = 200;
let sampleRate = 20000;
let period = sampleRate / totalWidth; // How many pixels before the wave repeats
let ang_vel = 0.0;
let yvalues; // Using an array to store height values for the wave
const BIT_DEPTH_MAX = 16;
let bitDepth;
const numHarm = 2;
const halfPanel = totalHeight / numPanels / 2;

let freqSlider, sampleRateSlider, ampSlider, bitDepthSlider;

function sliderSetup() {
  freqSlider = createSlider(200, sampleRate / 8, 1250);
  freqSlider.position(10, height - height / numPanels + 10);
  freqSlider.style('width', '200px');
  freqDisplayer = createP()
  freqDisplayer.position(freqSlider.x * 2 + freqSlider.width, height - height / numPanels - 5);
  freqSlider.input(updateGraphics);
  ampSlider = createSlider(0.0, 1.0, 1.0, .01);
  ampSlider.position(10, height - height / numPanels + 50);
  ampSlider.style('width', '200px');
  ampDisplayer = createP()
  ampDisplayer.position(ampSlider.x * 2 + ampSlider.width, height - height / numPanels + 35);
  ampSlider.input(updateGraphics);

  // bitDepthSlider = createSlider(1, BIT_DEPTH_MAX, BIT_DEPTH_MAX, 1);
  // bitDepthSlider.position(10, height - height / numPanels + 100);
  // bitDepthSlider.style('width', '200px');
  // bitDepthDisplayer = createP()
  // bitDepthDisplayer.position(bitDepthSlider.x * 2 + bitDepthSlider.width, height - height / numPanels + 85);
  // bitDepthSlider.input(updateGraphics);

  sampleRateSlider = createSlider(10000, 20000, 20000);
  sampleRateSlider.position(totalWidth / 2 + 10, height - height / numPanels + 10);
  sampleRateSlider.style('width', '200px');
  sampleRateDisplayer = createP()
  sampleRateDisplayer.position(sampleRateSlider.x + sampleRateSlider.width * 1.1, height - height / numPanels);
  sampleRateSlider.input(updateGraphics);
}

function setup() {

  createCanvas(totalWidth, totalHeight);
  dx = (TWO_PI * freq / sampleRate) / period; // * xspacing;
  yvalues = new Array(floor(w)); // xspacing));
  let panelHeight = totalHeight / numPanels;
  // Create all of your off-screen graphics buffers
  signalBuffer = createGraphics(w, panelHeight);
  rightBuffer = createGraphics(w, panelHeight);
  waveBuffer = createGraphics(w, panelHeight);
  impulseBuffer = createGraphics(w, panelHeight);
  sliderBuffer = createGraphics(totalWidth, panelHeight);
  impFreqBuffer = createGraphics(w, panelHeight);
  sampFreqBuffer = createGraphics(w, panelHeight);

  signalBuffer.strokeWeight(3); // Thicker
  rightBuffer.strokeWeight(3); // Thicker
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

function calcWave(quantize = false) {
  // Increment theta (try different values for
  // 'angular velocity' here)
  theta += ang_vel;
  let max = pow(2, bitDepth - 1);
  // For every x value, calculate a y value with sine function
  let x = theta;
  for (let i = 0; i < yvalues.length; i++) {
    yvalues[i] = 0;
    for (let j = 1; j <= numHarm; j++) {
      yvalues[i] += sin(x * j) / j // + sin(j * x) / j + sin(5 * x) / 5 + sin(7 * x) / 7;
    }
    yvalues[i] *= .66 * amplitude;
    // if (quantize == true) {
    //   if (bitDepth >= BIT_DEPTH_MAX) {
    //     //  do no quantization
    //   } else {
    //     //   scale to max value
    //     yvalues[i] = (floor((yvalues[i]) * max + 0.5)) / max;
    //   }
    // }
    //Scale to window size with a little bit of a buffer for max amp
    yvalues[i] *= -height / numPanels / 2.2;

    x += dx;
  }
}





function renderContWave() {

  // A simple way to draw the wave with an ellipse at each location
  waveBuffer.line(0, totalHeight / 2 / numPanels, totalWidth / 2, totalHeight / 2 / numPanels);
  for (let x = 0; x < yvalues.length; x++) {
    waveBuffer.line(x - 1, yvalues[x - 1] + totalHeight / numPanels / 2, x, yvalues[x] + totalHeight / numPanels / 2);
    waveBuffer.ellipse(x, totalHeight / numPanels / 2 + yvalues[x], 1, 1);
  }
}

function draw() {

  // Paint the off-screen buffers onto the main canvas
  image(waveBuffer, 0, 0);
  image(impulseBuffer, 0, totalHeight / numPanels);
  image(signalBuffer, 0, totalHeight / numPanels * 2);
  image(waveBuffer, 0, totalHeight / numPanels * 3); // "reconstructed signal"
  image(rightBuffer, w, 0);
  image(impFreqBuffer, w, totalHeight / numPanels);
  image(sampFreqBuffer, w, totalHeight / numPanels * 2);

  image(sliderBuffer, 0, totalHeight / 2);

  //Update the audio parameters
  //osc.freq(freq, 0.1);
  // osc.amp(amplitude * .95, 0.1);
}

function drawSampledBuffer() {

  signalBuffer.background("black");
  signalBuffer.fill("white");
  signalBuffer.stroke(255, 125, 125);
  signalBuffer.line(0, totalHeight / numPanels / 2, width, totalHeight / numPanels / 2);
  //calcWave();
  for (let x = 0; x < w / period; x++) {
    let xpos = round(x * 20000 / sampleRate * period);
    signalBuffer.line(xpos, totalHeight / numPanels / 2, xpos, yvalues[xpos] + totalHeight / numPanels / 2);
    signalBuffer.ellipse(xpos, yvalues[xpos] + totalHeight / numPanels / 2, 10);
  }
}

function drawImpulseBuffer() {
  impulseBuffer.background("black");
  impulseBuffer.fill("white");
  impulseBuffer.stroke(255, 125, 125);
  impulseBuffer.line(0, totalHeight / numPanels * .75, width, totalHeight / numPanels * .75);

  for (let x = 0; x < w / period; x++) {
    let xpos = x * 20000 / sampleRate * period;
    impulseBuffer.line(xpos, totalHeight / numPanels * .75, xpos, totalHeight / numPanels / 4);
    impulseBuffer.ellipse(xpos, totalHeight / numPanels / 4, 10, 10);
  }


}

function drawWaveBuffer() {

  waveBuffer.background("black");
  waveBuffer.stroke(255, 125, 125);
  waveBuffer.line(0, totalHeight / numPanels / 2, width, totalHeight / numPanels / 2);
  calcWave();
  renderContWave();
}

function drawFreqBuffer() {

  rightBuffer.background(255, 125, 125);
  rightBuffer.stroke(0, 0, 0);
  rightBuffer.line(0, totalHeight / numPanels / 2, width, totalHeight / numPanels / 2);
  rightBuffer.line(600, 0, 1200, 100);
  let ypos = totalHeight / numPanels / 2;

  for (let x = 1; x <= numHarm; x++) {
    let xpos = freq / 20000 * x * w / 2 - 1;
    rightBuffer.line(xpos, totalHeight / numPanels / 2, xpos, ypos * (1 - amplitude * .8 / x));

  }
  let xpos = sampleRate / 20000 * w / 4;

  //rightBuffer.line(0, ypos * (1 - amplitude * .9), x1, ypos * (1 - amplitude * .9))
  rightBuffer.line(0, ypos * .1, xpos, ypos * .1)
  rightBuffer.line(xpos, ypos * .1, xpos + 1, ypos)

}

function drawImpFreqBuffer() {
  impFreqBuffer.background(255, 125, 125);
  impFreqBuffer.fill("white");
  impFreqBuffer.stroke("black");
  impFreqBuffer.line(0, totalHeight / numPanels * .75, width, totalHeight / numPanels * .75);
  let ypos = totalHeight / numPanels / 2;

  for (let x = 0; x <= 4; x++) {
    let xpos = sampleRate / 20000 * x * w / 2;
    //impFreqBuffer.line(xpos, totalHeight / numPanels / 2, xpos, ypos );
    impFreqBuffer.line(xpos, totalHeight / numPanels * .75, xpos, totalHeight / numPanels / 4);
    if (x > 0) {
      impFreqBuffer.text((x) + "FS", xpos - 5, totalHeight / numPanels - 10)
    }

  }
}

function drawSampFreqBuffer() {
  sampFreqBuffer.background(255, 125, 125);
  sampFreqBuffer.fill("white");
  sampFreqBuffer.stroke("black");
  sampFreqBuffer.line(0, totalHeight / numPanels * .75, width, totalHeight / numPanels * .75);

  let ypos = totalHeight / numPanels * .75;

  for (let x = 0; x <= 4; x++) {
    let xpos = sampleRate / 20000 * x * w / 2;
    //Draw impulse resp
    sampFreqBuffer.line(xpos, totalHeight / numPanels * .75, xpos, totalHeight / numPanels / 8);
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
  period = 20000 / totalWidth;
  //bitDepth = bitDepthSlider.value();
  dx = (TWO_PI * freq / 20000 / period) //* xspacing;
  freqDisplayer.html('Frequency: ' + freqSlider.value() + " Hz")
  ampDisplayer.html('Amplitude: ' + ampSlider.value())
  // bitDepthDisplayer.html('Bit Depth: ' + bitDepthSlider.value())
  sampleRateDisplayer.html('Sample Rate: ' + sampleRateSlider.value() / 1000 + " kHz")

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
