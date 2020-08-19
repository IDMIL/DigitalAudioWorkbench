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

}

class freqSlider extends slider{
  setup(p,sliderWidth,numPanels,settings){
    console.log("setting up slider: " + name);
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
    this.slider.input(updateGraphics);
    this.textLabel = p.createP();
    this.textLabel.position(x + slider.width * 1.1, y - 15);
  }

}
