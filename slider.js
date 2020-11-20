class slider{
  button;
  slider;
  constructor(){
  }

  setup(p, settings){
    // should be overridden to set up the slider
  }

  updateValue(p){
    this.settings[this.propName] = this.slider.value();
    this.displayVal = this.calcDisplayVal();
    this.textBox.value(this.displayVal);
    this.textLabel.html(this.name+': ');
  }

  onEdit(){
    this.updateValue();
    this.settings.render();
    this.settings.p5.draw();
  }

  makeSlider(p){
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.textLabel = p.createP();
    this.slider.input(this.onEdit.bind(this));
    this.slider.mousePressed(this.onEdit.bind(this));
    this.slider.mouseReleased(this.onEdit.bind(this));
    this.textBox = p.createInput();
    this.textBox.size(300);
    this.button = p.createButton("Update");
    // this.button.size(200)
    this.button.mousePressed(this.buttonPressed.bind(this));
    this.button.mouseReleased(this.onEdit.bind(this));
  }

  resize(x, y, w, p){
    let width = w - 20;
    let labelWidth = 250;
    width -= labelWidth;
    let sliderWidth = width * 0.6;
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
    this.slider.value(this.calcSliderVal());  }

  calcSliderVal(){
    // override this with any calculations needed to convert textbox val to slider val (%, etc)
    return this.textBox.value();
  }
  calcDisplayVal(){
    // override this with any calculations needed to convert stored variable to display val (%, etc)
    return this.settings[this.propName];
  }
}


class freqSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Frequency (Hz)";
    this.propName = "fundFreq";
    this.min = 0;
    this.max = this.settings.sampleRate / 4 ;
    this.initial = 440;
    this.step = 1.0;
    this.displayVal = this.initial;
    this.makeSlider(p);
  }

}

class numHarmSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Number of harmonics";
    this.propName="numHarm"
    this.min = 1;
    this.max = 20;
    this.initial = 1;
    this.step = 1;
    this.displayVal = this.initial;
    this.oddEvenSel = p.createSelect();
    this.oddEvenSel.option("Odd");
    this.oddEvenSel.option("Even");
    this.oddEvenSel.option("All");
    this.oddEvenSel.selected(this.settings.harmType);
    this.oddEvenSel.changed(()=>this.settings.harmType = this.oddEvenSel.value());

    this.slopeSel = p.createSelect();
    this.slopeSel.option("1/x");
    this.slopeSel.option("1/x2");
    this.slopeSel.option("lin");
    this.slopeSel.option("flat");
    this.slopeSel.selected(this.settings.harmSlope);
    this.slopeSel.changed(()=>this.settings.harmSlope = this.slopeSel.value());

    this.makeSlider(p);
  }
  resize(x, y, w, p){

    let width = w - 20;
    let labelWidth = 250;
    width -= labelWidth;
    let sliderWidth = width * 0.5; // slider + dropdowns
    width -= sliderWidth;
    let dropDownWidth = sliderWidth * .25-10; // Make slider + dropdown the same width as other sliders.
    sliderWidth = sliderWidth * .75; // Slider
    let textboxWidth = width * 0.42;
    let buttonWidth = width*.4;

    this.slider.style('width', Math.round(sliderWidth).toString() + "px");
    this.slider.position(x, y);
    this.oddEvenSel.style('width', Math.round(dropDownWidth).toString() + "px");
    this.oddEvenSel.position(x+this.slider.width+10,y);
    this.slopeSel.style('width', Math.round(dropDownWidth).toString() + "px");
    this.slopeSel.position(x+this.slider.width+dropDownWidth+10,y);
    this.textLabel.position(x + 2*dropDownWidth + this.slider.width + 20, y - 15);
    this.textBox.position(x + this.slider.width + 2*dropDownWidth+ labelWidth+10,y);
    this.textBox.style('width', Math.round(textboxWidth).toString() + "px");
    this.button.position(this.textBox.x + this.textBox.width,y);
    this.button.style('width', Math.round(buttonWidth).toString() + "px");
  }
  }


class sampleRateSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Sample Rate(Hz):";
    this.propName="downsamplingFactor";
    this.min = p.log(3000)/p.log(2);
    this.max =  p.log(48000)/p.log(2);
    this.initial = p.log(48000)/p.log(2);
    this.step = 0.1
    this.makeSlider(p);
  }
  calcDisplayVal(){
    return this.displayVal= Math.round(this.settings.sampleRate / this.settings.downsamplingFactor , 3);//
  }
  calcSliderVal(){
    return Math.log(this.textBox.value())/Math.log(2);
  }

  updateValue(p){
    this.settings.downsamplingFactor = Math.round(WEBAUDIO_MAX_SAMPLERATE/Math.pow(2, this.slider.value()));
    this.displayVal = this.calcDisplayVal();
    this.textBox.value(this.displayVal);//
    this.textLabel.html(this.name);// + p.round(this.settings.sampleRate / this.settings.downsamplingFactor / 1000, 3) + " kHz")
  }
}

class ditherSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Dither";
    this.propName="dither";
    this.min = 0.0;
    this.max =  1.0;
    this.initial = 0.0;
    this.step = 0.01;
    this.makeSlider(p);
  }

}

class bitDepthSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Bit Depth";
    this.propName = "bitDepth";
    this.min = 1;
    this.max =  BIT_DEPTH_MAX;
    this.initial = BIT_DEPTH_MAX;
    this.step = 1;
    this.makeSlider(p);
  }

}

class amplitudeSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.propName ="amplitude";
    this.name = "Amplitude";
    this.min = 0.0;
    this.max =  5;
    this.initial = 1.0;
    this.step = 0.01;
    this.makeSlider(p);
  }

}

class antialiasingSlider extends slider {
  setup(p, settings){
    this.settings = settings;
    this.propName ="antialiasing";
    this.name = "Antialiasing filter order";
    this.min = 0.0;
    this.max =  200;
    this.initial = 0;
    this.step = 10;
    this.makeSlider(p);
  }
}

class phaseSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.propName ="phase";
    this.name = "Phase (Degrees)";
    this.min = 0;
    this.max =  360; //pi
    this.initial = 0.0;
    this.step = 1; //pi/8
    this.makeSlider(p);
}

  calcDisplayVal(){return this.settings[this.propName];}
}
class zoomSlider extends slider{
  calcDisplayVal(){return this.settings[this.propName]*100;}
  calcSliderVal(){
    if (isNaN(this.textBox.value())){
      return this.slider.value();
    }
    else{
      return this.textBox.value()/100;
    }
  }
}
class ampZoomSlider extends zoomSlider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Amp. Zoom (%)";
    this.propName="ampZoom";
    this.min = .1;
    this.max = 4.0;
    this.initial =1.0;
    this.step = .01;
    this.makeSlider(p);
}
}

const minTimeZoom = .25;
class timeZoomSlider extends zoomSlider{
  setup(p,settings){
    this.settings = settings;
    this.propName ="timeZoom";
    this.name = "Time zoom (%)"
    this.min = minTimeZoom;
    this.max =  3;
    this.initial = 1.0;
    this.step = .01;
    this.makeSlider(p);
}

}

const minFreqZoom = 0.5;
class freqZoomSlider extends zoomSlider{
  setup(p,settings){
    this.settings = settings;
    this.propName ="freqZoom";
    this.min = minFreqZoom;
    this.max =  3;
    this.initial = 1.0;
    this.step = .01;
    this.makeSlider(p);
}
updateValue(p){
  this.settings.freqZoom = this.slider.value();
  this.settings.maxVisibleFrequency = WEBAUDIO_MAX_SAMPLERATE/2/this.settings.freqZoom;
  this.textBox.value(this.settings.freqZoom*100);
  this.textLabel.html('Freq. zoom (%):');
  }
}
