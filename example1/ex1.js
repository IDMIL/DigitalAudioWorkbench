const BIT_DEPTH_MAX = 25;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;

function new_widget(totalHeight, totalWidth, numColumns, panels, sliders) { const sketch = p => {

// let freqSlider,
let sampleRateSlider, ditherSlider, bitDepthSlider, originalButton, reconstructedButton, numHarmSlider;
let snd;
var numPanels = panels.length;
var numSliders = sliders.length;
let panelHeight = totalHeight / Math.ceil((numPanels+1)/numColumns);
let panelWidth = totalWidth / numColumns;
let sliderWidth = totalWidth/numColumns;
  //
// set fftSize to the largest power of two that will approximately fill the panel
let fftSize = p.pow(2, p.round(p.log(panelWidth) / p.log(2)));
let fft = new FFTJS(fftSize);
var settings =
    { amplitude : 1.0
    , fundFreq : 1250
    , sampleRate : WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor : 2
    , numHarm : 2
    , phase : 0.0
    , fftSize : fftSize
    , bitDepth : BIT_DEPTH_MAX
    , dither : 0.0
    , original: new Float32Array(WEBAUDIO_MAX_SAMPLERATE)
    , downsampled: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE/4))
    , reconstructed: new Float32Array(WEBAUDIO_MAX_SAMPLERATE)
    , originalFreq : fft.createComplexArray()
    , reconstructedFreq : fft.createComplexArray()
    };

p.setup = function () {
  p.createCanvas(totalWidth, totalHeight);
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));
  sliders.forEach(slider => slider.setup(p,sliderWidth,numPanels,settings));
  buttonSetup();
  updateGraphics();
  // p.noLoop();
}

p.draw = function() {
  updateGraphics();

  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y);
  });
}

function buttonSetup() {

  originalButton = p.createButton("play original");
  originalButton.position(p.width/2 + 10, p.height - p.height / numPanels + 90);
  originalButton.mousePressed( () => {
    if (!snd) snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.original, WEBAUDIO_MAX_SAMPLERATE, snd);
  });

  reconstructedButton = p.createButton("play reconstructed");
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  reconstructedButton.mousePressed( () => {
    if (!snd) snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructed, WEBAUDIO_MAX_SAMPLERATE, snd);
  });
}

function updateGraphics() {
  readSliders();
  renderWaves()
  .then( _ => {
    panels.forEach(panel => panel.drawPanel());
    // p.draw();
  });
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
  settings.original.fill(0);
  console.log(settings.amplitude);
  settings.original.forEach( (_, i, arr) => {
    for (let harmonic = 1; harmonic <= settings.numHarm; harmonic++) {
      let omega = 2 * Math.PI * settings.fundFreq * harmonic;
      arr[i] += settings.amplitude * Math.sin(omega * i / WEBAUDIO_MAX_SAMPLERATE+settings.phase) / harmonic;
    }
  });
  let max = Math.max.apply(Math, settings.original);
  //settings.original.forEach( (samp, i, arr) => arr[i] = samp / max );
  // render original wave FFT
  // TODO: window the input
  fft.realTransform(settings.originalFreq, settings.original);
  fft.completeSpectrum(settings.originalFreq);

  // render "sampled" wave (actually just downsampled original)
  settings.downsampled = new Float32Array(p.round(WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor));
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
  // TODO: use a better upsampling method (Chromium just does linear interp)
  offlineSnd = new OfflineAudioContext(1, WEBAUDIO_MAX_SAMPLERATE, WEBAUDIO_MAX_SAMPLERATE);
  playWave(settings.downsampled, WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor, offlineSnd);
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

function readSliders() {
  sliders.forEach(slider => slider.updateValue(p));
}

}; return new p5(sketch); } // end function new_widget() { var sketch = p => {

const widget = new_widget(900,1600,NUM_COLUMNS,
  [ new inputSigPanel()
  , new inputSigFFTPanel()
  , new impulsePanel()
  , new impulseFreqPanel()
  , new sampledInputPanel()
  , new sampledInputFreqPanel()
  , new reconstructedSigPanel()
  , new sampledSigFFTPanel()
  ],
  [ new freqSlider()
  , new numHarmSlider()
  , new sampleRateSlider()
  , new ditherSlider()
  , new bitDepthSlider()
  , new amplitudeSlider()
  , new phaseSlider()
  ]
);
