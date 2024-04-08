// list of update components
var updatable = [];

// find available animation frame updater
requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(f){ return setTimeout(f, 1000/60)};

// init function
(function (){
    const core = new GameCore({
        element: document.querySelector(".game-container")
    });
    core.init();

    // register updatable
    updatable.push(core);

    update();
})();

function update(){
    for(let u of updatable){
        u.update();
    }

    requestAnimationFrame(update);
}
