const BIT_DEPTH_MAX = 16;

function new_widget(totalHeight, totalWidth, numColumns, panels) { const sketch = p => {
let freqSlider, sampleRateSlider, ampSlider, bitDepthSlider;

var numPanels = panels.length;
let panelHeight = totalHeight / Math.ceil((numPanels+1)/numColumns);
let panelWidth = totalWidth / numColumns;
var settings = {signal: new Array(p.floor(panelWidth)),
                amplitude : 1.0,
                fundFreq : 1250,
                sampleRate : 20000,
                numHarm : 2,

};

let phaseOffset = 3.1415 / 2;
let phaseOffsetIncrement = 0.0; // Not used currently
let phaseIncrement;
let imagePeriod = settings.sampleRate / totalWidth; // How many pixels before the wave repeats
let bitDepth;

p.setup = function () {
  p.createCanvas(totalWidth, totalHeight);
  phaseIncrement = (p.TWO_PI * settings.fundFreq / 20000 / imagePeriod);
  //signal = new Array(p.floor(panelWidth));
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));

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
  freqSlider = p.createSlider(200, settings.sampleRate / 8, settings.fundFreq);
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
  for (let i = 0; i < settings.signal.length; i++) {
    settings.signal[i] = 0;
    for (let harmonic = 1; harmonic <= settings.numHarm; harmonic++) {
      settings.signal[i] += p.sin(phase * harmonic) / harmonic;
    }
    // scale height < 1 because of multiple harmonics
    settings.signal[i] *= .66 * settings.amplitude;
    // if (quantize == true) {
    //   if (bitDepth >= BIT_DEPTH_MAX) {
    //     //  do no quantization
    //   } else {
    //     //   scale to max value
    //     signal[i] = (p.floor((signal[i]) * max + 0.5)) / max;
    //   }
    // }
    //Scale to window size with a little bit of a buffer for max amp
    settings.signal[i] *= -p.height / numPanels / 2.2;

    phase += phaseIncrement;
  }
}



function drawSampFreqBuffer() {
  let ypos = p.height / numPanels * .75;
  sampFreqBuffer.background(255, 125, 125);
  sampFreqBuffer.fill("white");
  sampFreqBuffer.stroke("black");
  sampFreqBuffer.line(0, ypos, p.width, ypos);

  for (let x = 0; x <= 4; x++) {
    let xpos = settings.sampleRate / 20000 * x * panelWidth / 2;
    //Draw impulse resp
    sampFreqBuffer.line(xpos, ypos, xpos, p.height / numPanels / 8);
    sampFreqBuffer.line(xpos, p.height / numPanels / 8, xpos, p.height / numPanels / 8);
    //Draw harmonics
    for (let harm = 1; harm <= settings.numHarm; harm++) {
      let xPositive = xpos + settings.fundFreq * harm * panelWidth / 2 / 20000;
      let xNegative = xpos - settings.fundFreq * harm * panelWidth / 2 / 20000;
      let yEnd = ypos * (1 - settings.amplitude * .6 / harm);
      sampFreqBuffer.line(xPositive, ypos, xPositive, yEnd);
      sampFreqBuffer.line(xNegative, ypos, xNegative, yEnd);
    }
  }
}

function drawSliderBuffer() {
  settings.fundFreq = freqSlider.value();
  settings.amplitude = ampSlider.value();
  settings.sampleRate = sampleRateSlider.value();
  //bitDepth = bitDepthSlider.value();
  phaseIncrement = (p.TWO_PI * settings.fundFreq / 20000 / imagePeriod) //* xspacing;
  freqDisplayer.html('Frequency: ' + freqSlider.value() + " Hz")
  ampDisplayer.html('Amplitude: ' + ampSlider.value())
  // bitDepthDisplayer.html('Bit Depth: ' + bitDepthSlider.value())
  sampleRateDisplayer.html('Sample Rate: ' + sampleRateSlider.value() / 1000 + " kHz")
}

}; return new p5(sketch); } // end function new_widget() { var sketch = p => {

const widget = new_widget(600,900,2,
  [ new inputSigPanel()
  , new inputSigFreqPanel()
  , new impulsePanel()
  , new impulseFreqPanel()
  , new sampledInputPanel()
  , new sampledInputFreqPanel()]
);
