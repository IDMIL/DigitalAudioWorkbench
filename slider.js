class slider{
  constructor(settings){
    this.settings = settings;
    // this.name =  name;
    // this.min = min,
    // this.max = max;
    // this.initial = initial;
    // this.step = step;
    // this.x = x;
    // this.y =y;
    // this.width = '200px';
    // this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    // this.slider.position(this.x, this.y);
    // this.slider.style('width', this.width);
    // this.slider.input(updateGraphics);
    // this.textLabel = p.createP();
    // this.textLabel.position(this.x + this.slider.width * 1.1, this.y - 15);
  }
  // setup(){
  //
  // }
  updateValue(){
  // Should be overridden by a function reading the slider and setting the appropraite "settings" variable
};
}

class freqSlider extends slider{
  setup(p,sliderWidth,numPanels,settings){
    this.settings = settings;
    this.name ="freq";
    this.min = p.log(200)/p.log(2);
    this.max = (p.log(this.settings.sampleRate / 2 / 5)/p.log(2));
    this.initial = (p.log(settings.fundFreq)/p.log(2));
    this.step = 0.001;
    this.x = 10;
    this.y =  p.height - p.height / numPanels + 10;
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.slider.position(this.x, this.y);
    this.slider.style('width', '200px');
    // this.slider.input(p.draw);//updateGraphics);
    this.textLabel = p.createP();
    this.textLabel.position(this.x + this.slider.width * 1.1, this.y - 15);
  }
  updateValue(p){
    this.settings.fundFreq = p.pow(2,this.slider.value());
    this.textLabel.html('Fundamental: ' + p.round(this.settings.fundFreq) + " Hz")

  }
}
class numHarmSlider extends slider{
  setup(p,sliderWidth,numPanels,settings){
    this.settings = settings;
    this.name ="Bandwidth";
    this.min = 1;
    this.max = 5;
    this.initial = 1;
    this.step = 1;
    this.x = 10;
    this.y =  p.height - p.height / numPanels + 50;
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.slider.position(this.x, this.y);
    this.slider.style('width', '200px');
    this.slider.input(p.draw);//updateGraphics);
    this.textLabel = p.createP();
    this.textLabel.position(this.x + this.slider.width * 1.1, this.y - 15);
  }
  updateValue(p){
    this.settings.numHarm = p.pow(2,this.slider.value());
    this.textLabel.html(this.name +": "+ p.round(this.settings.fundFreq * this.settings.numHarm) + " Hz")

  }
}
class sampleRateSlider extends slider{
  setup(p,sliderWidth,numPanels,settings){
    // console.log("sample rate slider setup;")
    this.settings = settings;
    this.name ="Sample Rate";
    this.min = p.log(3000)/p.log(2);
    this.max =  p.log(48000)/p.log(2);
    this.initial = p.log(48000)/p.log(2);
    this.step = 0.1
    this.x = 10;
    this.y =  p.height - p.height / numPanels + 90
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.slider.position(this.x, this.y);
    this.slider.style('width', '200px');
    this.slider.input(p.draw);//updateGraphics);
    this.textLabel = p.createP();
    this.textLabel.position(this.x + this.slider.width * 1.1, this.y - 15);
  }
  updateValue(p){
    this.settings.sampleRate = p.pow(2,this.slider.value());
    this.settings.downsamplingFactor = p.round(96000/this.settings.sampleRate);
    this.textLabel.html('Sample Rate: ' + p.round(this.settings.sampleRate / this.settings.downsamplingFactor / 1000, 3) + " kHz")
    }
}
class ditherSlider extends slider {
  setup(p,sliderWidth,numPanels,settings){
    // console.log("dither slider setup;")
    this.settings = settings;
    this.name ="Dither";
    this.min = 0.0;
    this.max =  1.0;
    this.initial = 0.0;
    this.step = 0.01
    this.x =  p.width/2 + 10;
    this.y =  p.height - p.height / numPanels + 50
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.slider.position(this.x, this.y);
    this.slider.style('width', '200px');
    this.slider.input(p.draw);//updateGraphics);
    this.textLabel = p.createP();
    this.textLabel.position(this.x + this.slider.width * 1.1, this.y - 15);  }
  updateValue(p){
    this.settings.dither = this.slider.value();
    this.textLabel.html('Dither: ' + p.round(this.settings.dither, 3));
}
}
class bitDepthSlider extends slider {
  setup(p,sliderWidth,numPanels,settings){
    // console.log("Bit depth slider setup;")
    this.settings = settings;
    this.name ="Bit Depth";
    this.min = 1;
    this.max =  32;
    this.initial = 32;
    this.step = 1;
    this.x =  p.width/2 + 10;
    this.y =  p.height - p.height / numPanels + 10;
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.slider.position(this.x, this.y);
    this.slider.style('width', '200px');
    this.slider.input(p.draw);//updateGraphics);
    this.textLabel = p.createP();
    this.textLabel.position(this.x + this.slider.width * 1.1, this.y - 15);  }

  updateValue(p){
    this.settings.bitDepth = this.slider.value();
    this.textLabel.html('Bit Depth: ' + (this.settings.bitDepth == BIT_DEPTH_MAX ? 'Float32' : this.settings.bitDepth));
    console.log("Bit depth updated")
  }
}
