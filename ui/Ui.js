// reference for new UI
class UI {
  setPosition() {}
  draw() {}
}

class Text {
  constructor(
    ctx,
    text,
    size,
    fontFamily,
    options = {
      x: 0,
      y: 0,
      maxWidth: undefined,
    }
  ) {
    this.ctx = ctx;
    this.size = size;
    this.text = text;
    this.fontFamily = fontFamily;
    this.options = options;
  }

  setColor(color) {
    this.ctx.fillStyle = color;
  }

  setPosition(x, y) {
    this.options.x = x;
    this.options.y = y;
  }

  draw() {
    this.ctx.font = `${this.size} ${this.fontFamily}`;
    this.ctx.fillText(
      this.text,
      this.options.x,
      this.options.y,
      this.options.maxWidth
    );
  }
}

class Button {
  // callback
  onClick = () => {};
  onClickAnimation;
  waitForAnimation = 100;

  constructor(
    ctx,
    text,
    prop = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      color: "white",
      textColor: "black",
      textAlign: "center",
      fontFamily: "Arial",
      textSize: "25px",
      onPressColor: "gray",
    }
  ) {
    this.ctx = ctx;
    this.text = text;

    for (let p of Object.keys(prop)) {
      this[p] = prop[p];
    }
  }

  // override
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  setBackgroundColor(color) {
    this.color = color;
  }

  setTextColor(color) {
    this.textColor = color;
  }

  setFontSize(px) {
    if (!px.includes("px")) {
      px += "px";
    }
    this.textSize = px;
  }

  setOnClick(cfunction) {
    this.onClick = cfunction;
  }

  addAnimation(animFunction, duration = 100) {
    this.onClickAnimation = animFunction;
    this.waitForAnimation = duration;
  }

  run() {
    if (this.onClickAnimation != undefined) {
      this.onClickAnimation();
    }
    setTimeout(this.onClick, this.waitForAnimation);
  }

  isWithinRange(mouseX, mouseY) {
    return !(
      mouseX < this.x ||
      mouseX > this.x + this.width ||
      mouseY < this.y ||
      mouseY > this.y + this.height
    );
  }

  // override method
  draw() {
    // background
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    // text on button
    this.ctx.fillStyle = this.textColor;
    this.ctx.textAlign = this.textAlign;
    this.ctx.font = `${this.textSize} ${this.fontFamily}`;
    this.ctx.fillText(
      this.text,
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width
    );
  }

  // sample pressing animation
  renderPressing() {
    this.color = this.onPressColor;
    this.draw();
  }
}

// -------------------------------------
//                  Template
// -------------------------------------

class FieldFrame {
    unitSlotSize = {
        width: 270,
        height: 420
    }

    constructor(ctx){
        this.ctx = ctx;
        this.unitSlotsUI = [];

        this.playerSide = "bottom";
    }

    static getUnitSlotSmall(){
        return {
            width: 135,
            height: 210
        }
    }

    setUnitSlotSize(width, height){
        this.unitSlotSize.width = width;
        this.unitSlotSize.height = height;
    }

    createUnitSlots(){
        
        let unitSlotCount = 3;
        
        let usize = FieldFrame.getUnitSlotSmall();
        this.setUnitSlotSize(usize.width, usize.height);

        let slot_gap = 20;

        let xInit = (this.ctx.game_container_width / 2) - ((usize.width * 2) - (usize.width / 2)) - slot_gap;
      
        let yInit = this.ctx.game_container_height / 2;
        if(this.playerSide == "bottom"){
          yInit = (this.ctx.game_container_height / 2) + slot_gap;
        } else if(this.playerSide == "top"){
          yInit = (this.ctx.game_container_height / 2) - slot_gap - usize.height;
        }


        let lastSlotWidth = 0;
        for(let i = 0; i < unitSlotCount; i++){
            this.ctx.strokeStyle = "white";
            let currentStart = 0;
            if(i == 0){
                currentStart = xInit * (i + 1);
            } else {
                currentStart = lastSlotWidth + slot_gap;
            }

            lastSlotWidth = currentStart + this.unitSlotSize.width;
            this.ctx.strokeRect(currentStart, yInit, this.unitSlotSize.width, this.unitSlotSize.height);

            this.unitSlotsUI.push({
                slot: i,
                x: currentStart,
                y: yInit,
                width: this.unitSlotSize.width,
                height: this.unitSlotSize.height,
                empty: true
            });
        }
    }


    // overide
    draw(){
        this.createUnitSlots();
    }
}

class CardFrame {
  // card size state
  big = false;
  small = false;

  borderOffset = 2;

  // render by data
  renderDataNotFound = "show-data";

  // expect CardEffect
  constructor(ctx, cardData) {
    this.ctx = ctx;
    this.cardData = cardData;

    // init if not found
    if(this.cardData["imgSourcePositionX"] == undefined){
      this.cardData.imgSourcePositionX = 0;
    }
    if(this.cardData["imgSourcePositionY"] == undefined){
      this.cardData.imgSourcePositionY = 0;
    }
    if(this.cardData["imgSourceWidth"] == undefined){
      this.cardData.imgSourceWidth = 0;
    }
    if(this.cardData["imgSourceHeight"] == undefined){
      this.cardData.imgSourceHeight = 0;
    }
  }

  // card border
  createCardBorder(x, y, width, height) {
    //
    this.ctx.strokeStyle = this.cardData.clanColor;
    this.ctx.strokeRect(x, y, width, height);
  }

  async loadImage(source) {
    return new Promise((r) => {
      let img = new Image();
      img.onload = () => r(img);
      img.src = source;
    });
  }

  // card picture
  async createCardImage() {
    let img = await loadImage(this.cardData.imgSource);
    if (img != undefined || img != null) {
      this.ctx.drawImage(
        img,
        this.cardData.imgSourcePositionX,
        this.cardData.imgSourcePositionY
      );
    }
  }

  draw() {
    this.createCardImage();
    this.createCardBorder(
      this.cardData.imgSourcePositionX,
      this.cardData.imgSourcePositionY,
      this.cardData.imgSourceWidth,
      this.cardData.imgSourceHeight
    );
  }
}

class Hand {

  constructor(ctx, hand){
    this.ctx = ctx;
    this.hand = hand;

    this.playerSide = "bottom";

    // default
    this.x_init_pos = this.ctx.game_container_width / 2;
    this.y_init_pos = this.ctx.game_container_height / 2;
  }

  draw(){

    let card_size = FieldFrame.getUnitSlotSmall();

    switch (this.playerSide) {
      case "bottom":
        this.y_init_pos += 200;
        break;
      case "top":
        this.y_init_pos = -50;
        break;
    }

    console.log("hand", this.hand);
    for(let card of this.hand){
      let render_card = new CardFrame(this.ctx, card);
      render_card.draw();
    }
  }
}