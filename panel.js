//Panel class. should be extended with a drawPanel method
class Panel {
  constructor(name,height, width, position,colour1,colour2) {
    this.name = name;
    this.height = height;
    this.width = width;
    this.position = position;
    this.colour1 = "white";
    this.colour2 = "black";
    this.buffer = createGraphics(this.width, this.height);
    this.strokeWeight = 3;
  }
  drawPanel(x,y){}

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
