class slider{
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
  }

  resize(x, y, sliderWidth){
    this.slider.style('width', Math.round(sliderWidth).toString() + "px");
    this.slider.position(x, y);
    this.textLabel.position(x + this.slider.width + 10, y - 15);
  }
}

class freqSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="freq";
    this.min = p.log(200)/p.log(2);
    this.max = (p.log(this.settings.sampleRate / 2 / 5)/p.log(2));
    this.initial = (p.log(settings.fundFreq)/p.log(2));
    this.step = 0.001;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.fundFreq = p.pow(2,this.slider.value());
    this.textLabel.html('Fundamental: ' + p.round(this.settings.fundFreq) + " Hz")

  }
}

class numHarmSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Bandwidth";
    this.min = 1;
    this.max = 5;
    this.initial = 1;
    this.step = 1;
    this.makeSlider(p);
  }

  updateValue(p){
    this.settings.numHarm = this.slider.value();
    this.textLabel.html(this.name +": "+ p.round(this.settings.fundFreq * this.settings.numHarm) + " Hz")
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
    this.textLabel.html('Sample Rate: ' + p.round(this.settings.sampleRate / this.settings.downsamplingFactor / 1000, 3) + " kHz")
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
    this.textLabel.html('Dither: ' + p.round(this.settings.dither, 3));
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
    this.textLabel.html('Bit Depth: ' + (this.settings.bitDepth == BIT_DEPTH_MAX ? 'Float32' : this.settings.bitDepth));
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
    this.textLabel.html('Amplitude: ' + (this.settings.amplitude));
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
    this.textLabel.html("Antialiasing: " + (this.settings.antialiasing < 1 ? 'None' : this.settings.antialiasing + "th Order FIR"));
  }
}
