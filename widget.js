const BIT_DEPTH_MAX = 25;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;

function new_widget(panels, sliders) { const sketch = p => {

// let freqSlider,
let sampleRateSlider, ditherSlider, bitDepthSlider, originalButton, reconstructedButton, numHarmSlider;
var numPanels = panels.length;
var numSliders = sliders.length;
let panelHeight, panelWidth, sliderWidth, sliderHeight, numColumns;
resize(1080, 1920);

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
    , snd : undefined
    };

p.setup = function () {
  p.createCanvas(p.windowWidth, p.windowHeight);
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));
  sliders.forEach(slider => slider.setup(p, settings));
  buttonSetup();
  p.windowResized();
  p.noLoop();
  setTimeout(p.draw, 250);
};

p.draw = function() {
  sliders.forEach(slider => slider.updateValue(p)); // read sliders

  renderWaves()
  .then( _ => {
    panels.forEach(panel => panel.drawPanel());
  });

  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y);
  });
};

p.windowResized = function() {
  let w = p.windowWidth - 20; // TODO: get panel bezel somehow instead of hardcoded 20
  let h = p.windowHeight - 20;
  resize(w, h);
  p.resizeCanvas(w, h);
  panels.forEach(panel => panel.resize(panelHeight, panelWidth));

  let yoffset = panelHeight * p.ceil(numPanels/numColumns) + 20;
  sliders.forEach( (slider, index) => {
    let y = yoffset + p.floor(index / numColumns) * sliderHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    slider.resize(x + 20, y, sliderWidth);
  });

  let y = yoffset + p.floor((numSliders)/ numColumns) * sliderHeight;
  let x = p.floor((numSliders) % numColumns) * panelWidth;
  originalButton.position(x + 20, y);
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
};

function resize(w, h) {
  if (w < 800) numColumns = 1;
  else numColumns = 2;
  let panelRows = Math.ceil((numPanels+1)/numColumns);
  let sliderRows = Math.ceil((numSliders+1)/numColumns);
  panelWidth   = w / numColumns;
  sliderWidth  = w / numColumns - 200;
  panelHeight  = h / panelRows;
  sliderHeight = panelHeight / sliderRows;
  if (sliderHeight < 30) { // keep sliders from getting squished
    sliderHeight = 30;
    let sliderPanelHeight = sliderHeight * sliderRows;
    panelHeight = (h - sliderPanelHeight) / (panelRows - 1);
  }
}

function buttonSetup() {

  originalButton = p.createButton("play original");
  originalButton.position(p.width/2 + 10, p.height - p.height / numPanels + 90);
  originalButton.mousePressed( () => {
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.original, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });

  reconstructedButton = p.createButton("play reconstructed");
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  reconstructedButton.mousePressed( () => {
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructed, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
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
      arr[i] += settings.amplitude * Math.sin(omega * i / WEBAUDIO_MAX_SAMPLERATE) / harmonic;
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

}; 
return new p5(sketch); } // end function new_widget() { var sketch = p => {
