const BIT_DEPTH_MAX = 25;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;
function new_widget(totalHeight, totalWidth, numColumns, panels) { const sketch = p => {
let freqSlider, sampleRateSlider, ditherSlider, bitDepthSlider, originalButton, reconstructedButton, numHarmSlider;

let snd;

var numPanels = panels.length;
let panelHeight = totalHeight / Math.ceil((numPanels+1)/numColumns);
let panelWidth = totalWidth / numColumns;
// set fftSize to the largest power of two that will approximately fill the panel
let fftSize = p.pow(2, p.round(p.log(panelWidth) / p.log(2)));
let fft = new FFTJS(fftSize);
var settings = 
    { amplitude : 1.0
    , fundFreq : 1250
    , sampleRate : WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor : 2
    , numHarm : 2
    , fftSize : fftSize
    , bitDepth : BIT_DEPTH_MAX
    , dither : 0.0
    , original: new Float32Array(WEBAUDIO_MAX_SAMPLERATE)
    , downsampled: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE/4))
    , reconstructed: new Float32Array(WEBAUDIO_MAX_SAMPLERATE)
    , originalFreq : fft.createComplexArray()
    , reconstructedFreq : fft.createComplexArray()
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
  p.noLoop();
}

p.draw = function() {
  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y);
  });
}

function sliderSetup() {
  freqSlider = p.createSlider((p.log(200)/p.log(2))*1000, 
                              (p.log(settings.sampleRate / 2 / 5)/p.log(2))*1000, 
                              (p.log(settings.fundFreq)/p.log(2))*1000);
  freqSlider.position(10, p.height - p.height / numPanels + 10);
  freqSlider.style('width', '200px');
  freqSlider.input(updateGraphics);

  freqDisplayer = p.createP();
  freqDisplayer.position(freqSlider.x + freqSlider.width * 1.1, freqSlider.y - 15);

  numHarmSlider = p.createSlider(1, 5, 1);
  numHarmSlider.position(10, p.height - p.height / numPanels + 50);
  numHarmSlider.style('width', '200px');
  numHarmSlider.input(updateGraphics);

  numHarmDisplayer = p.createP();
  numHarmDisplayer.position(numHarmSlider.x + numHarmSlider.width * 1.1, numHarmSlider.y - 15);

  sampleRateSlider = p.createSlider(p.log(3000)/p.log(2)*1000, 
                                    p.log(48000)/p.log(2)*1000, 
                                    p.log(48000)/p.log(2)*1000);
  sampleRateSlider.position(10, p.height - p.height / numPanels + 90);
  sampleRateSlider.style('width', '200px');
  sampleRateSlider.input(updateGraphics);

  sampleRateDisplayer = p.createP()
  sampleRateDisplayer.position(sampleRateSlider.x + sampleRateSlider.width * 1.1, sampleRateSlider.y - 15);

  ditherSlider = p.createSlider(0.0, 1.0, 0.0, .01);
  ditherSlider.position(p.width/2 + 10, numHarmSlider.y);
  ditherSlider.style('width', '200px');
  ditherSlider.input(updateGraphics);

  ditherDisplayer = p.createP()
  ditherDisplayer.position(ditherSlider.x + ditherSlider.width * 1.1, ditherSlider.y - 15);

  bitDepthSlider = p.createSlider(1, BIT_DEPTH_MAX, BIT_DEPTH_MAX);
  bitDepthSlider.position(p.width / 2 + 10, freqSlider.y);
  bitDepthSlider.style('width', '200px');
  bitDepthSlider.input(updateGraphics);
  bitDepthDisplayer = p.createP()
  bitDepthDisplayer.position(bitDepthSlider.x + bitDepthSlider.width * 1.1, bitDepthSlider.y - 15);

  originalButton = p.createButton("play original");
  originalButton.position(bitDepthSlider.x, sampleRateSlider.y);
  originalButton.mousePressed( () => {
    if (!snd) snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.original, settings.sampleRate, snd);
  });
  reconstructedButton = p.createButton("play reconstructed");
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  reconstructedButton.mousePressed( () => {
    if (!snd) snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructed, settings.sampleRate, snd);
  });
}

function updateGraphics() {
  drawSliderBuffer();
  renderWaves()
  .then( _ => {
    panels.forEach(panel => panel.drawPanel());
    p.draw();
  });
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
    settings.signal[i] *=  0.75*settings.amplitude/settings.numHarm;
    // if (quantize == true) {
    //   if (bitDepth >= BIT_DEPTH_MAX) {
    //     //  do no quantization
    //   } else {
    //     //   scale to max value
    //     signal[i] = (p.floor((signal[i]) * max + 0.5)) / max;
    //   }
    // }
    //Scale to window size with a little bit of a buffer for max amp
    // settings.signal[i] *= -p.height / (numPanels/NUM_COLUMNS) / 2.2;

    phase += phaseIncrement;
  }
}

function renderWaves() {
  var offlineSnd, fftNode;
  var fftOptions = 
      { fftSize: settings.fftSize
      , maxDecibels: 0
      , minDecibels: -100
      , smoothingTimeConstant: 0
      };
  // render original wave
  // TODO: configurable additive synthesis
  settings.original.fill(0);
  settings.original.forEach( (_, i, arr) => {
    for (let harmonic = 1; harmonic <= settings.numHarm; harmonic++) {
      let omega = 2 * Math.PI * settings.fundFreq * harmonic;
      arr[i] += settings.amplitude * Math.sin(omega * i / settings.sampleRate) / harmonic;
    }
  });
  let max = Math.max.apply(Math, settings.original);
  settings.original.forEach( (samp, i, arr) => arr[i] = samp / max );

  // render original wave FFT
  // TODO: window the input
  fft.realTransform(settings.originalFreq, settings.original);
  fft.completeSpectrum(settings.originalFreq);

  // render "sampled" wave (actually just downsampled original)
  // TODO: quantization and dither
  settings.downsampled = new Float32Array(p.round(settings.sampleRate / settings.downsamplingFactor));
  settings.downsampled.forEach( (_, i, arr) => {
    let y = settings.original[i * settings.downsamplingFactor];
    if (settings.bitDepth == BIT_DEPTH_MAX) return arr[i] = y;
    let maxInt = p.pow(2, settings.bitDepth - 1);
    let dither = (2 * Math.random() - 1) * settings.dither;
    let rectified = (dither + y) * 0.5 + 0.5;
    let quantized = p.round(rectified * maxInt);
    let renormalized = quantized / maxInt;
    let centered = 2 * renormalized - 1;
    arr[i] = centered;
  });

  // render reconstructed wave using an OfflineAudioContext for upsampling
  offlineSnd = new OfflineAudioContext(1, WEBAUDIO_MAX_SAMPLERATE, WEBAUDIO_MAX_SAMPLERATE); 
  playWave(settings.downsampled, settings.sampleRate / settings.downsamplingFactor, offlineSnd);
  return offlineSnd.startRendering()
    .then( buffer => settings.reconstructed = buffer.getChannelData(0) )
    .then( _ => {
      // render the reconstructed wave FFT
      // TODO: window the input
      fft.realTransform(settings.reconstructedFreq, settings.reconstructed)
      fft.completeSpectrum(settings.reconstructedFreq);
    });
}

function playWave(wave, sampleRate, audioctx) {
  var buffer = audioctx.createBuffer(1, wave.length, sampleRate);
  buffer.copyToChannel(wave, 0, 0);
  var source = audioctx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioctx.destination);
  source.start();
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
  settings.fundFreq = p.pow(2,freqSlider.value()/1000);
  settings.numHarm = numHarmSlider.value();
  settings.dither = ditherSlider.value();
  settings.downsamplingFactor = p.round(96000/p.pow(2, sampleRateSlider.value()/1000));
  settings.bitDepth = bitDepthSlider.value();
  phaseIncrement = (p.TWO_PI * settings.fundFreq / 20000 / imagePeriod)
  freqDisplayer.html('Fundamental: ' + p.round(settings.fundFreq) + " Hz")
  numHarmDisplayer.html('Bandwidth: ' + p.round(settings.fundFreq * settings.numHarm) + " Hz")
  ditherDisplayer.html('Dither: ' + p.round(settings.dither, 3));
  bitDepthDisplayer.html('Bit Depth: ' + (settings.bitDepth == BIT_DEPTH_MAX ? 'Float32' : settings.bitDepth));
  sampleRateDisplayer.html('Sample Rate: ' + p.round(settings.sampleRate / settings.downsamplingFactor / 1000, 3) + " kHz")
}

}; return new p5(sketch); } // end function new_widget() { var sketch = p => {

const widget = new_widget(900,1200,NUM_COLUMNS,
  [ new inputSigPanel()
  , new inputSigFFTPanel()
  , new impulsePanel()
  , new sampledInputPanel()
  , new reconstructedSigPanel()
  , new sampledSigFFTPanel()
  ]
);
