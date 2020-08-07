function new_widget(totalHeight, totalWidth, numColumns, panels) { const sketch = p => {

let freqSlider, sampleRateSlider, ampSlider, bitDepthSlider;

var numPanels = panels.length;
let panelHeight = totalHeight / Math.ceil((numPanels+1)/numColumns);
let panelWidth = totalWidth / numColumns;

let phaseOffset = 3.1415 / 2;
let phaseOffsetIncrement = 0.0; // Not used currently
let amplitude = 1.0;
let fundamentalFrequency = 1250;
let phaseIncrement;
let sampleRate = 20000;
const numHarm = 2; // number of harmonics in signal
let yvalues; // Using an array to store height values for the wave
let imagePeriod = sampleRate / totalWidth; // How many pixels before the wave repeats

let bitDepth;
const BIT_DEPTH_MAX = 16;

p.setup = function () {
  p.createCanvas(totalWidth, totalHeight);
  phaseIncrement = (p.TWO_PI * fundamentalFrequency / 20000 / imagePeriod);
  yvalues = new Array(p.floor(panelWidth));
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, yvalues));

  sliderSetup();
  updateGraphics();
}

p.draw = function() {
  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y);
  });
}

function sliderSetup() {
  freqSlider = p.createSlider(200, sampleRate / 8, fundamentalFrequency);
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
  calcWave();
  panels.forEach(panel => panel.drawPanel());
  drawSliderBuffer();
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
      let xPositive = xpos + fundamentalFrequency * harm * panelWidth / 2 / 20000;
      let xNegative = xpos - fundamentalFrequency * harm * panelWidth / 2 / 20000;
      let yEnd = ypos * (1 - amplitude * .6 / harm);
      sampFreqBuffer.line(xPositive, ypos, xPositive, yEnd);
      sampFreqBuffer.line(xNegative, ypos, xNegative, yEnd);
    }
  }
}

function drawSliderBuffer() {
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

const widget = new_widget(600,900,2,
  [ new inputSigPanel()
  , new inputSigPanel() // TODO: instantiate other panels
  , new inputSigPanel()
  , new inputSigPanel()
  , new inputSigPanel()
  , new inputSigPanel()
  ]);
