class slider{
  button;
  slider;
  displayScaler=1;
  constructor(){

  }

  setup(p, settings){
    // should be overridden to set up the slider
  }

  updateValue(){
  // Should be overridden by a function reading the slider and setting the appropraite "settings" variable
  }

  makeSlider(p){
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.textLabel = p.createP();
    this.slider.input(p.draw);
    this.slider.mousePressed(p.draw);
    this.slider.mouseReleased(p.draw);
    this.textBox = p.createInput();
    this.textBox.size(50);
    this.button = p.createButton("Update");
    this.button.mousePressed(this.buttonPressed.bind(this));
    this.button.mouseReleased(p.draw);
  }

  resize(x, y, w, p){
    let width = w - 20;
    let labelWidth = 200;
    width -= labelWidth;
    let sliderWidth = width * 0.8;
    width -= sliderWidth;
    let textboxWidth = width * 0.5;
    width -= textboxWidth;
    let buttonWidth = width;

    this.slider.style('width', Math.round(sliderWidth).toString() + "px");
    this.slider.position(x, y);
    this.textLabel.position(x + this.slider.width + 10, y - 15);
    this.textBox.position(x+this.slider.width + labelWidth,y);
    this.textBox.style('width', Math.round(textboxWidth).toString() + "px");
    this.button.position(this.textBox.x+this.textBox.width+5,y);
    this.button.style('width', Math.round(buttonWidth).toString() + "px");
  }
  buttonPressed(){
    this.slider.value(this.textBox.value());  }

}

class freqSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Fundamental Frequency";
    this.min = 0;
    this.max = this.settings.sampleRate / 2 ;
    this.initial = 100;
    this.step = 1.0;
    this.displayVal = this.initial;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.fundFreq = this.slider.value();
    this.displayVal = this.settings.fundFreq;
    this.textBox.value(p.round(this.displayVal));

    this.textLabel.html(this.name+': ');
  }
}

class numHarmSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Number of Harmonics";
    this.min = 1;
    this.max = 10;
    this.initial = 1;
    this.step = 1;
    this.displayVal = this.initial;

    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.numHarm = this.slider.value();
    this.textBox.value(this.settings.numHarm);
    this.textLabel.html(this.name +": ");//+ p.round(this.settings.fundFreq * this.settings.numHarm) + " Hz")
  }
}

class sampleRateSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Sample Rate";
    this.min = p.log(3000)/p.log(2);
    this.max =  p.log(48000)/p.log(2);
    this.initial = p.log(48000)/p.log(2);
    this.step = 0.1
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.downsamplingFactor = p.round(WEBAUDIO_MAX_SAMPLERATE/p.pow(2, this.slider.value()));
    this.textBox.value(p.round(this.settings.sampleRate / this.settings.downsamplingFactor / 1000, 3)+" Khz");//
    this.textLabel.html('Sample Rate: ');// + p.round(this.settings.sampleRate / this.settings.downsamplingFactor / 1000, 3) + " kHz")
  }
}

class ditherSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Dither";
    this.min = 0.0;
    this.max =  1.0;
    this.initial = 0.0;
    this.step = 0.01;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.dither = this.slider.value();
    this.textBox.value(p.round(this.settings.dither, 3));
    this.textLabel.html('Dither: ');// + p.round(this.settings.dither, 3));
  }
}

class bitDepthSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Bit Depth";
    this.min = 1;
    this.max =  BIT_DEPTH_MAX;
    this.initial = BIT_DEPTH_MAX;
    this.step = 1;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.bitDepth = this.slider.value();
    this.textBox.value(this.settings.bitDepth );
    this.textLabel.html('Bit Depth: ');// + (this.settings.bitDepth == BIT_DEPTH_MAX ? 'Float32' : this.settings.bitDepth));
  }
}

class amplitudeSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Amplitude";
    this.min = 0.0;
    this.max =  1.0;
    this.initial = 1.0;
    this.step = 0.01;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.amplitude = this.slider.value();
    this.textBox.value(this.settings.amplitude);
    this.textLabel.html('Amplitude: ');// + (this.settings.amplitude));
  }
}

class antialiasingSlider extends slider {
  setup(p, settings){
    this.settings = settings;
    this.name ="Antialiasing";
    this.min = 0.0;
    this.max =  200;
    this.initial = 0;
    this.step = 10;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.antialiasing = this.slider.value();
    this.textBox.value(this.settings.antialiasing)
    this.textLabel.html("Antialiasing: ");// + (this.settings.antialiasing < 1 ? 'None' : this.settings.antialiasing + "th Order FIR"));
  }
}

class phaseSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Phase";
    this.min = 0;
    this.max =  2; //pi
    this.initial = 0.0;
    this.step = .001; //pi/8
    this.makeSlider(p);
}
  updateValue(p){
    let sliderVal = this.slider.value();
    this.settings.phase = sliderVal * Math.PI;
    this.textBox.value(this.settings.phase.toFixed(3) + '*PI');
    this.textLabel.html(this.name +": ");
  }
}

class ampZoomSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="ampZoom";
    this.min = .5;
    this.max = 2.0; //pi
    this.initial =1.0;
    this.step = .01; //pi/8
    this.makeSlider(p);
}
updateValue(p){
  this.settings.ampZoom = this.slider.value();
  this.textBox.value(this.settings.ampZoom*100 + "%");
  this.textLabel.html('Amp zoom: ');
  }
}
class timeZoomSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="timeZoom";
    this.min = .5;
    this.max =  2;
    this.initial = 1.0;
    this.step = .01;
    this.makeSlider(p);
}
updateValue(p){
  this.settings.timeZoom = this.slider.value();
  this.textBox.value(this.settings.timeZoom*100 + "%");
  this.textLabel.html('Time zoom: ');
  }
}
class freqZoomSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="freqZoom";
    this.min = .5;
    this.max =  5;
    this.initial = 1.0;
    this.step = .01;
    this.makeSlider(p);
}
updateValue(p){
  this.settings.freqZoom = this.slider.value();
  this.settings.maxVisibleFrequency = WEBAUDIO_MAX_SAMPLERATE/2/this.settings.freqZoom;
  this.textBox.value(this.settings.freqZoom*100 + "%");
  this.textLabel.html('Freq zoom: ');
  }
}
