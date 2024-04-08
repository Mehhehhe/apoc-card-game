// import * as card from "./Card";

class GameCore {
    constructor(config){
        this.element = config.element;
        this.canvas = this.element.querySelector('.game-display');
        this.ctx = this.canvas.getContext("2d");
    }

    init(){
        console.log("init game core");
        // game screen
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let cardEffect = new CardEffect();
    }

    update(){

    }
}