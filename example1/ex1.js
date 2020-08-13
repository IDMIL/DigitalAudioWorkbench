const BIT_DEPTH_MAX = 25;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;

function new_widget(totalHeight, totalWidth, numColumns, panels) { const sketch = p => {

let freqSlider, sampleRateSlider, ditherSlider, bitDepthSlider, originalButton, reconstructedButton, numHarmSlider;
let snd;
var numPanels = panels.length;
let panelHeight = totalHeight / Math.ceil((numPanels+1)/numColumns);
let panelWidth = totalWidth / numColumns;
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

function makeSlider(min, max, initial, step, x, y)
{
  let slider = p.createSlider(min, max, initial, step);
  slider.position(x, y);
  slider.style('width', '200px');
  slider.input(updateGraphics);
  let textLabel = p.createP();
  textLabel.position(x + slider.width * 1.1, y - 15);
  return [slider, textLabel];
}

function sliderSetup() {
  [freqSlider, freqDisplayer] = makeSlider
    ( (p.log(200)/p.log(2))
    , (p.log(settings.sampleRate / 2 / 5)/p.log(2))
    , (p.log(settings.fundFreq)/p.log(2))
    , 0.001
    , 10
    , p.height - p.height / numPanels + 10
    );

  [numHarmSlider, numHarmDisplayer] = makeSlider
    ( 1
    , 5
    , 1
    , 1
    , 10
    , p.height - p.height / numPanels + 50
    );

  [sampleRateSlider, sampleRateDisplayer] = makeSlider
    ( p.log(3000)/p.log(2)
    , p.log(48000)/p.log(2)
    , p.log(48000)/p.log(2)
    , 0.001
    , 10
    , p.height - p.height / numPanels + 90
    );

  [ditherSlider, ditherDisplayer] = makeSlider
    ( 0.0
    , 1.0
    , 0.0
    , .01
    , p.width/2 + 10
    , numHarmSlider.y
    );

  [bitDepthSlider, bitDepthDisplayer] = makeSlider
      ( 1
      , BIT_DEPTH_MAX
      , BIT_DEPTH_MAX
      , 1
      , p.width / 2 + 10
      , freqSlider.y
      );

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
  readSliders();
  renderWaves()
  .then( _ => {
    panels.forEach(panel => panel.drawPanel());
    p.draw();
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
  // TODO: use a better upsampling method (Chromium just does linear interp)
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

function readSliders() {
  settings.fundFreq = p.pow(2,freqSlider.value());
  settings.numHarm = numHarmSlider.value();
  settings.dither = ditherSlider.value();
  settings.downsamplingFactor = p.round(96000/p.pow(2, sampleRateSlider.value()));
  settings.bitDepth = bitDepthSlider.value();

  freqDisplayer.html('Fundamental: ' + p.round(settings.fundFreq) + " Hz")
  numHarmDisplayer.html('Bandwidth: ' + p.round(settings.fundFreq * settings.numHarm) + " Hz")
  ditherDisplayer.html('Dither: ' + p.round(settings.dither, 3));
  bitDepthDisplayer.html('Bit Depth: ' + (settings.bitDepth == BIT_DEPTH_MAX ? 'Float32' : settings.bitDepth));
  sampleRateDisplayer.html('Sample Rate: ' + p.round(settings.sampleRate / settings.downsamplingFactor / 1000, 3) + " kHz")
}

}; return new p5(sketch); } // end function new_widget() { var sketch = p => {

const widget = new_widget(900,1000,NUM_COLUMNS,
  [ new inputSigPanel()
  , new inputSigFFTPanel()
  , new impulsePanel()
  , new sampledInputPanel()
  , new reconstructedSigPanel()
  , new sampledSigFFTPanel()
  ]
);
