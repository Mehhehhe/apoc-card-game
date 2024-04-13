// import * as card from "./Card";

const GAME_STATE = {
    LOADING: -1,
    MAIN_MENU: 0,
    LOBBY: 1,
    GAME: 2,
    GAME_FINISH: 3
}

class GameCore {

    titleButtons = [];
    state = GAME_STATE.MAIN_MENU;

  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-display");
    this.ctx = this.canvas.getContext("2d");
  }

  init() {
    console.log("init game core");
    // game screen
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.setupTitleScreen();

    // on click handler
    this.canvas.addEventListener('click', (event) => {
        let c_x = event.pageX - (this.canvas.clientLeft + this.canvas.offsetLeft);
        let c_y = event.pageY - (this.canvas.clientTop + this.canvas.offsetTop);

        this.titleButtons.forEach((button) => {
            if(button.isWithinRange(c_x, c_y) && !!button.onClick){
                button.onClick();
            }
        });
    });
  }

  update() {
    //
    switch (this.state) {
        case GAME_STATE.MAIN_MENU:
            this.titleButtons.forEach((button) => {
                button.draw();
            });       
            break;
        default:
            break;
    }
  }

  clearScreen(){
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setupTitleScreen(){
    // create title
    let title = new Text(this.ctx, "Apoc TCG Demo", "48px", "Arial");
    title.setPosition(this.canvas.width / 2, this.canvas.height / 2);
    title.setColor("red");
    title.draw();

    // create play button
    let playButton = new Button(this.ctx, "Play");
    playButton.setPosition(this.canvas.width / 2 - 100, this.canvas.height / 2 + 100);
    playButton.setSize(100, 50);
    playButton.setOnClick(() => {
        console.log("play button clicked");
        // this.titleButtons.pop();
        this.state += 1;
        this.clearScreen();
        console.log("GAME STATE: ", this.state);
    });
    this.titleButtons.push(playButton);
  }
}
