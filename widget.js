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

// set fftSize to the largest power of two that will approximately fill the panel
let fftSize = p.pow(2, p.round(p.log(panelWidth) / p.log(2)));
let fft = new FFTJS(fftSize);
let firCalculator = new Fili.FirCoeffs();
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
    , dither : 0.0 // amplitude of white noise added to signal before quantization
    , antialiasing : 0 // antialiasing filter order
    , original: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , downsampled: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE/4*soundTimeSeconds))
    , reconstructed: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , quantNoise: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
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

function calcHarmonics(){
  let harmInc = 1; harmAmp =1; harmScale =1; harmonic = 1;
  if (settings.harmType =="Odd" || settings.harmType == "Even"){ harmInc=2;}
  while (harmonic<=settings.numHarm){
    if (settings.harmSlope == "lin") {  harmAmp = 1 - (harmonic-1)/(settings.numHarm)}
     else if (settings.harmSlope == "1/x") {harmAmp = 1/harmScale}
     else if (settings.harmSlope == "flat") {harmAmp = 1};
    settings.harmonicFreqs[harmonic-1] = harmScale*settings.fundFreq;
    settings.harmonicAmps[harmonic-1] = harmAmp;
    // console.log(settings.harmonicFreqs[harmonic], settings.harmonicAmps[harmonic]);

    (harmonic ==1 && settings.harmType != "Odd")? harmScale++ : harmScale +=harmInc;
    harmonic++;
  }
}
function renderWaves() {
  // render original wave
  calcHarmonics();
  settings.original.fill(0);

  settings.original.forEach( (_, i, arr) => {
    let harmonic =1;
    //Always calculate number of harmonics. omegaScale is the frequency scalar for each
    while (harmonic<=settings.numHarm){
      let freq = 2*Math.PI*settings.harmonicFreqs[harmonic-1]/WEBAUDIO_MAX_SAMPLERATE;
      let amp = settings.harmonicAmps[harmonic-1];
      //scale to radians, adjust harmonic phases
      let phase = Math.PI/180*settings.phase*settings.harmonicFreqs[harmonic-1]/settings.harmonicFreqs[0];
      arr[i] += settings.amplitude * Math.sin(freq * i + phase )*amp;
      harmonic++;
  }
});

  // render original wave FFT
  // TODO: window the input
  fft.realTransform(settings.originalFreq, settings.original);
  fft.completeSpectrum(settings.originalFreq);


  // apply antialiasing filter if applicable
  var original = settings.original;
  if (settings.antialiasing > 1) {
    var filterCoeffs = firCalculator.lowpass(
        { order: settings.antialiasing
        , Fs: WEBAUDIO_MAX_SAMPLERATE
        , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
        });
    var filter = new Fili.FirFilter(filterCoeffs);
    original = settings.original.map( x => filter.singleStep(x) );
    original.forEach( (x, i, arr) => arr[i - settings.antialiasing/2] = x );
  }

  // downsample original wave
  settings.reconstructed.fill(0);
  settings.quantNoise.fill(0);
  settings.downsampled = new Float32Array(p.round(WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor));
  settings.downsampled.forEach( (_, i, arr) => {
    let y = original[i * settings.downsamplingFactor];
    if (settings.bitDepth == BIT_DEPTH_MAX) {
      arr[i] = y;
      settings.reconstructed[i * settings.downsamplingFactor] = y;
      return
    }
    let maxInt = p.pow(2, settings.bitDepth - 1);
    let dither = (2 * Math.random() - 1) * settings.dither;
    let rectified = (dither + y) * 0.5 + 0.5;
    let quantized = p.round(rectified * maxInt);
    let renormalized = quantized / maxInt;
    let centered = 2 * renormalized - 1;
    arr[i] = centered;
    settings.reconstructed[i * settings.downsamplingFactor] = centered;
    settings.quantNoise[i] = centered -y;
  });

  // render reconstructed wave low pass filtering the zero stuffed array
  var filterCoeffs = firCalculator.lowpass(
      { order:  200
      , Fs: WEBAUDIO_MAX_SAMPLERATE
      , Fc: (WEBAUDIO_MAX_SAMPLERATE / settings.downsamplingFactor) / 2
      });
  var filter = new Fili.FirFilter(filterCoeffs);
  settings.reconstructed.forEach( (x, i, arr) => {
    let y = filter.singleStep(x);
    arr[i] = y * settings.downsamplingFactor;
  });
  settings.reconstructed.forEach( (x, i, arr) => arr[i - 100] = x );

  fft.realTransform(settings.reconstructedFreq, settings.reconstructed)
  fft.completeSpectrum(settings.reconstructedFreq);
  fft.realTransform(settings.quantNoiseFreq, settings.quantNoise)
  fft.completeSpectrum(settings.quantNoiseFreq);
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
