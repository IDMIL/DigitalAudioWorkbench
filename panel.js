const background = "white";
const stroke = "black";
const strokeWeight = 3;
const fill = "white";

//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(name,height, width, position,colour1,colour2) {
    this.name = name;
    this.height = height;
    this.width = width;
    this.position = position;
  }
  setup(p) {
    this.buffer = p.createGraphics(this.width, this.height);
    this.buffer.strokeWeight(strokeWeight);
    this.buffer.background(background);
    this.buffer.stroke(stroke);
    this.buffer.fill(fill);
  }
  drawPanel(x,y){
  }

}
//Container class for panels
class PanelCont {
  constructor (width,height){
    this.panels=[];
    this.width = width;
    this.height = height;
  }
  addPanel(panel){
    this.panels.push(panel)
  }
  removePanel(){

  }
  drawPanels(){
    for(let panel = 0; panel<this.panels.length;panel++){
      let x = (panels[panel].position%2) * this.width/2;
      let y = this.height/this.panels.length*((panels[panel].position%2));
      panels[panel].drawPanel(x,y);
    }
  }
}

class inputSigPanel extends Panel {
  drawPanel(x,y){

  }

}
class inputSigFreqPanel extends Panel {
  drawPanel(x,y){
  }
}

class impulsePanel extends Panel {
  drawPanel(x,y){
  }
}
class impulseFreqPanel extends Panel {
  drawPanel(x,y){
  }
}
class sampledInputPanel extends Panel{
  drawPanel(x,y){
  }
}
class sampledInputFreqPanel extends Panel{
  drawPanel(x,y){
  }
}
class interfacePanel extends Panel{
  drawPanel(x,y){
  }
}
