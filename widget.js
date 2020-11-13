const BIT_DEPTH_MAX = 16;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;
const soundTimeSeconds = .5;
const MAX_HARMONICS = 20;
function new_widget(panels, sliders) { const sketch = p => {

var numPanels = panels.length;
var numSliders = sliders.length;
let panelHeight, panelWidth, sliderWidth, sliderHeight, numColumns;
resize(1080, 1920);

// set display and fftSize to ensure there is enough data to fill the panels when zoomed all the way out
let fftSize = p.pow(2, p.round(p.log(panelWidth/minFreqZoom) / p.log(2)));
let displaySignalSize = p.max(fftSize, panelWidth/minTimeZoom) * 1.1; // 1.1 for 10% extra safety margin
let fft = new FFTJS(fftSize);
var settings =
    { amplitude : 1.0
    , fundFreq : 1250 // input signal fundamental freq
    , sampleRate : WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor : 2
    , numHarm : 2 //Number of harmonics
    , harmType : "Odd" // Harmonic series to evaluate - Odd, even or all
    , harmSlope : "1/x" // Amplitude scaling for harmonics. can be used to create different shapes like saw or square
    , harmonicFreqs : new Float32Array(MAX_HARMONICS) //Array storing harmonic frequency in hz
    , harmonicAmps  : new Float32Array(MAX_HARMONICS) //Array storing harmonic amp  (0-1.0)
    , phase : 0.0 // phase offset for input signal
    , fftSize : fftSize
    , bitDepth : BIT_DEPTH_MAX //quantization bit depth
    , quantType : "midRise" // type of quantization
    , dither : 0.0 // amplitude of white noise added to signal before quantization
    , antialiasing : 0 // antialiasing filter order
    , original: new Float32Array(displaySignalSize)
    , downsampled: new Float32Array(1) // this gets re-inited when rendering waves
    , reconstructed: new Float32Array(displaySignalSize)
    , quantNoise: new Float32Array(displaySignalSize)
    , original_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , reconstructed_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , quantNoise_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , originalFreq : fft.createComplexArray()
    , reconstructedFreq : fft.createComplexArray()
    , quantNoiseFreq : fft.createComplexArray()
    , snd : undefined
    , maxVisibleFrequency : WEBAUDIO_MAX_SAMPLERATE / 2
    , freqZoom : 1.0 //X axis zoom for frequency panels
    , ampZoom : 1.0 // Y axis zoom for all panels
    , timeZoom: 1.0 // X axis zoom for signal panels
    };

p.setup = function () {
  p.createCanvas(p.windowWidth, p.windowHeight);
  p.textAlign(p.CENTER);
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));
  sliders.forEach(slider => slider.setup(p, settings));
  buttonSetup();
  p.windowResized();
  p.noLoop();
  setTimeout(p.draw, 250);
};

p.draw = function() {
  sliders.forEach(slider => slider.updateValue(p)); // read sliders

  renderWaves();

  panels.forEach(panel => panel.drawPanel());

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
    slider.resize(x + 20, y, sliderWidth,p);
  });

  let y = yoffset + p.floor((numSliders)/ numColumns) * sliderHeight;
  let x = p.floor((numSliders) % numColumns) * panelWidth;
  originalButton.position(x + 20, y);
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width * 1.1, reconstructedButton.y);
};

function resize(w, h) {
  if (w < 800) numColumns = 1;
  else numColumns = 2;
  let panelRows = Math.ceil((numPanels+1)/numColumns);
  let sliderRows = Math.ceil((numSliders+1)/numColumns);
  panelWidth   = w / numColumns;
  sliderWidth  = w / numColumns;
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
  quantNoiseButton = p.createButton("play quantization noise");
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width * 1.1, reconstructedButton.y);
  quantNoiseButton.mousePressed( () => {
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.quantNoise, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
}

var renderWaves = renderWavesImpl(settings, fft, p);

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
