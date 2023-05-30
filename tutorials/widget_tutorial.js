const BIT_DEPTH_MAX = 16;
const WEBAUDIO_MAX_SAMPLERATE = 96000;  
const NUM_COLUMNS = 2;
const MAX_HARMONICS = 100;
function new_widget(panels, sliders, buttons, elem_id, elem_id2, margin_size, width_factor=1.0, height_factor=1.0) { const sketch = p => {

var element = undefined;
if (elem_id) {
   element = document.getElementById(elem_id);
   console.log(element.id);
   console.log(element.clientHeight, element.clientWidth);

}
var intro_text = document.getElementsByClassName(elem_id2);
var intro_height = 0;

var numPanels = panels.length;
var numSliders = sliders.length;
var old_x = 220;
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
    , stuffed: new Float32Array(displaySignalSize)
    , quantNoiseStuffed: new Float32Array(displaySignalSize)
    , quantNoise: new Float32Array(displaySignalSize)
    , original_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , reconstructed_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , quantNoise_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , originalFreq : fft.createComplexArray()
    , stuffedFreq : fft.createComplexArray()
    , reconstructedFreq : fft.createComplexArray()
    , quantNoiseFreq : fft.createComplexArray()
    , snd : undefined
    , maxVisibleFrequency : WEBAUDIO_MAX_SAMPLERATE / 2
    , freqZoom : 1.0 //X axis zoom for frequency panels
    , ampZoom : 1.0 // Y axis zoom for all panels
    , timeZoom: 1.0 // X axis zoom for signal panels
    , element : element
    , margine_size : margin_size+20
    , p5: undefined
    , render : undefined
    , play : undefined
    };

p.settings = settings;

var renderWaves = renderWavesImpl(settings, fft, p);

p.setup = function () {
  settings.p5 = p;
  settings.render = renderWaves;
  settings.play = playWave;

  p.createCanvas(p.windowWidth, p.windowHeight);
  console.log(p.windowWidth,p.windowHeight)
  p.textAlign(p.CENTER);
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));
  sliders.forEach(slider => slider.setup(p, settings));
  sliders.forEach(slider => slider.updateValue(p));
  renderWaves();
  buttonSetup();
  p.windowResized();
  p.noLoop();
  setTimeout(p.draw, 250);
};

p.draw = function() {
  panels.forEach(panel => panel.drawPanel());
  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y);
  });
};

p.windowResized = function() {
  console.log(p.windowWidth,p.windowHeight)
  let w = width_factor * p.windowWidth - 20; // TODO: get panel bezel somehow instead of hardcoded 20
  let h = height_factor * p.windowHeight - 20;
  resize(w, h);
  
  p.resizeCanvas(w, h);
  panels.forEach(panel => panel.resize(panelHeight, panelWidth));

  intro_text.forEach(element => {
    intro_height += element.clientHeight;
  })
  let yoffset = panelHeight * p.ceil(numPanels/numColumns) + intro_height + 100;
  let sliderPos = new Array(numColumns).fill(1);
  sliderPos.forEach((pos,index)=>{
    sliderPos[index] = 150+index*sliderWidth;
  });
 
  console.log("slider position", sliderPos);
  sliders.forEach( (slider, index) => {
    let y = yoffset + p.floor(index / numColumns) * sliderHeight;
    //let x = p.floor(index % numColumns) * panelWidth;
    slider.resize(sliderPos[index % numColumns], y, sliderWidth,p);
  });
  let y = yoffset + p.floor((numSliders)/ numColumns) * sliderHeight;
  let x = margin_size;
  originalButton.position(x + 20, y);
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width * 1.1, reconstructedButton.y);
  intro_height = 0;
};

function resize(w, h) {
  if (w < 800 || (numPanels % 2 == 1)) numColumns = 1;
  else numColumns = 2;
  let panelRows = Math.ceil((numPanels+1)/numColumns);
  let sliderRows = Math.ceil((numSliders+1)/numColumns);
  panelWidth   = w / numColumns;
  sliderWidth  = w / numColumns - 200;
  panelHeight  = h / panelRows;
  sliderHeight = 200 / sliderRows;
  if (sliderHeight < 30) { // keep sliders from getting squished
    sliderHeight = 30;
    let sliderPanelHeight = sliderHeight * sliderRows;
    panelHeight = (h - sliderPanelHeight) / (panelRows - 1);
  }
}

function buttonSetup() {
  originalButton = p.createButton("play original");
  originalButton.position(p.width/2 + 10, p.height - p.height / numPanels );
  originalButton.mousePressed( () => {
  renderWaves(true);
  if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
  playWave(settings.original_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  originalButton.parent(element.id);
  if(!buttons.includes("original")){
    originalButton.hide();
  }
  
  reconstructedButton = p.createButton("play reconstructed");
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  reconstructedButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructed_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  reconstructedButton.parent(element.id);
  if(!buttons.includes("recon")){
    reconstructedButton.hide();
  }
  quantNoiseButton = p.createButton("play quantization noise");
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width * 1.1, reconstructedButton.y);
  quantNoiseButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.quantNoise_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  quantNoiseButton.parent(element.id);
  if(!buttons.includes("quant")){
    quantNoiseButton.hide();
  }
  
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
