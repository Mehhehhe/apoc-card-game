// import * as card from "./Card";

const GAME_STATE = {
  LOADING: -1,
  MAIN_MENU: 0,
  LOBBY: 1,
  GAME: 2,
  GAME_FINISH: 3,
};

class GameCore {
  titleButtons = [];
  state = GAME_STATE.MAIN_MENU;

  // game object temp
  currentOnGameState = {};

  constructor(config) {
    this.element = config.element;
    this.canvas = this.element.querySelector(".game-display");
    this.ctx = this.canvas.getContext("2d");


    this.ctx["game_container_width"] = this.canvas.width;
    this.ctx["game_container_height"] = this.canvas.height;
  }

  init() {
    console.log("init game core");
    // game screen
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.setupTitleScreen();

    // on click handler
    this.canvas.addEventListener("click", (event) => {
      let c_x = event.pageX - (this.canvas.clientLeft + this.canvas.offsetLeft);
      let c_y = event.pageY - (this.canvas.clientTop + this.canvas.offsetTop);

      this.titleButtons.forEach((button) => {
        if (button.isWithinRange(c_x, c_y) && !!button.onClick) {
          button.run();
        }
      });
    });
  }

  update() {
    //
    switch (this.state) {
      case GAME_STATE.MAIN_MENU:
        break;
      case GAME_STATE.GAME:
        break;
      default:
        break;
    }
  }

  clearScreen() {
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  beforeTimeout(thenFn = () => {}, loadFunction) {
    loadFunction();
    setTimeout(thenFn, 1000);
  }

  // ------------------------ scenes ------------------------------------

  showLoading() {
    let loadingText = new Text(this.ctx, "Loading ... ", "48px", "Arial");
    loadingText.setPosition(this.canvas.width / 2 - 150, this.canvas.height / 2 - 150);
    loadingText.setColor("white");
    loadingText.draw();
  }

  setupTitleScreen() {
    // create title
    let title = new Text(this.ctx, "Apoc TCG Demo", "48px", "Arial");
    title.setPosition(this.canvas.width / 2, this.canvas.height / 2);
    title.setColor("red");
    title.draw();

    // create play button
    let playButton = new Button(this.ctx, "Play");
    playButton.setPosition(
      this.canvas.width / 2 - 100,
      this.canvas.height / 2 + 100
    );
    playButton.setSize(100, 50);
    playButton.setOnClick(() => {
      console.log("play button clicked");
      // this.titleButtons.pop();
      this.state += 1;
      this.clearScreen();
      console.log("GAME STATE: ", this.state);
    
      this.initializeOnGame();
      this.setupOnGameScreen();
    });
    playButton.addAnimation(() => {
      playButton.renderPressing();
    });
    this.titleButtons.push(playButton);

    this.titleButtons.forEach((button) => {
      button.draw();
    });
  }

  initializeOnGame(){
    // if(this.state != GAME_STATE.GAME){
    //     return;
    // }
    // set up field
    this.currentOnGameState["player1"] = new Player();
    this.currentOnGameState["player2"] = new Player();

    this.currentOnGameState.player1.init("Player 1");
    this.currentOnGameState.player2.init("Player 2");
  }

  setupOnGameScreen() {
    
    // TODO: render by player prospective, will handle by networking later ...

    // draw field
    let player1Field = new FieldFrame(this.ctx);
    player1Field.draw();

    this.currentOnGameState.player1["ui_state"] = {
        unit_slots: player1Field.unitSlotsUI
    };

    let player2Field = new FieldFrame(this.ctx);
    player2Field.playerSide = "top";
    player2Field.draw();
    this.currentOnGameState.player2["ui_state"] = {
        unit_slots: player2Field.unitSlotsUI
    };


    // render hand
    this.currentOnGameState.player1.ui_state["hand"] = new Hand(
      this.ctx, 
      this.currentOnGameState.player1.hand
    );

    this.currentOnGameState.player1.ui_state.hand.draw();


  }
}
