// reference for new UI 
class UI {
    setPosition(){}
    draw(){}
}

class Text {
    constructor(ctx, text, size, fontFamily, options = {
        x: 0,
        y: 0,
        maxWidth: undefined,
    }){
        this.ctx = ctx;
        this.size = size;
        this.text = text;
        this.fontFamily = fontFamily;
        this.options = options;
    }

    setColor(color){
        this.ctx.fillStyle = color;
    }

    setPosition(x, y){
        this.options.x = x;
        this.options.y = y;
    }

    draw(){
        this.ctx.font = `${this.size} ${this.fontFamily}`
        this.ctx.fillText(this.text, this.options.x, this.options.y, this.options.maxWidth);
    }
    
}

class Button {
    // callback
    onClick = () => {};

    constructor(ctx, text, prop = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: "white",
        textColor: "black",
        textAlign: "center",
        fontFamily: "Arial",
        textSize: "25px",
    }){
        this.ctx = ctx;
        this.text = text;

        for(let p of Object.keys(prop)){
            this[p] = prop[p];
        }
    }

    // override
    setPosition(x, y){
        this.x = x;
        this.y = y;
    }

    setSize(width, height){
        this.width = width;
        this.height = height;
    }

    setBackgroundColor(color){
        this.color = color;
    }

    setTextColor(color){
        this.textColor = color;
    }

    setFontSize(px){
        if(!px.includes('px')){
            px += 'px';
        }
        this.textSize = px;
    }

    setOnClick(cfunction){
        this.onClick = cfunction;
    }

    isWithinRange(mouseX, mouseY){
        return !(mouseX < this.x || mouseX > this.x + this.width || mouseY < this.y || mouseY > this.y + this.height);
    }

    // override method
    draw(){
        // background
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);

        // text on button
        this.ctx.fillStyle = this.textColor;
        this.ctx.textAlign = this.textAlign;
        this.ctx.font = `${this.textSize} ${this.fontFamily}`;
        this.ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2, this.width);       
    }
}