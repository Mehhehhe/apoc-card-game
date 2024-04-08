// place files you want to import through the `$lib` alias in this folder.

let testMode = true;

const dummyCardTemplate = {
    id: 0,
    name: "test_card",
    hp: 1,
    atk: 1,
    cost: 1,

    effect: {
        normal: "[P]: Draw 1.",
        activations: {
            play_effect: [
                {
                    action: "draw",
                    amount: 1
                }
            ],
            act_effect: []
        }
    }
};

//MARK: CARD_STATE
const CARD_STATE = {
    STANDBY_PHASE: "STANDBY_PHASE",
    RESOURCE_PHASE: "RESOURCE_PHASE",
    IN_DECK: "IN_DECK",
    ON_DRAW: "ON_DRAW",
    HAND: "HAND",
    PLACE_TO_FIELD: "PLACE_TO_FIELD",
    PLACE_TO_RESOURCE: "PLACE_TO_RESOURCE",
    PAY_CARD_COST: "PAY_CARD_COST",
    ACTIVATE_ONPLAY: "ACTIVATE_ONPLAY",
    IDLE_ON_FIELD: "IDLE_ON_FIELD",
    REST: "REST",
    ATTACK: "ATTACK",
    DMG_CALC: "DMG_CALC",
    AFTER_BATTLE: "AFTER_BATTLE",
    END_PHASE: "END_PHASE",
    UNKNOWN: "UNKNOWN"
};

getDummyDeck = () => {
    let deck = [];

    for(let i = 0; i < 40; i++){
        deck[i] = dummyCardTemplate;
    }

    return deck;
};

class Effect {
    static executeEffect(effectType, event){
        switch (effectType) {
            case "play":
                
                break;
            case "act":
                break;
            default:
                break;
        }
    }
}

class Card {
    constructor(face, value){
        this.face = face;
        this.value = value;
    }
}

//MARK: CardEffect
class CardEffect {
    owner;
    
    id;
    name;

    hp;
    atk;
    cost;

    effect = {
        normal: "",
        activations: {
            play_effect: [],
            act_effect: []
        }
    };

    state = CARD_STATE.IN_DECK;

    // effect activation
    callback = {};

    constructor(){}

    init(source, owner){
        this.id = source.id;
        this.name = source.id;
        this.cost = source.cost;
        this.effect = source.effect;
        this.hp = source.hp;
        this.atk = source.atk;

        this.owner = owner;

        if(source.effect.activations.play_effect.length > 0){
            // bind play effect to unit
            this.callback.play = function(){
                let executeOrders = this.effect.activations.play_effect;
                for(let idx = 0; idx < executeOrders.length; idx++){
                    switch(executeOrders[idx].action){
                        case "draw":
                            console.log("length", owner.getHandSize());
                            owner.hand[owner.getHandSize()] = owner.deck.draw(executeOrders[idx].amount);
                            break;
                    }
                }
            }
        }
        if(source.effect.activations.act_effect.length > 0){
            this.callback["act"] = null;
        }

        return this;
    }

    on = function(cb){
        cb.call(this);
    }
}

//MARK: Deck
class Deck {

    cards = [];
    total = 0;

    constructor(){}

    static tryLoadDeck(playerId, deck){
        let result = {};
        try {
            // use topic /getDeck with payload of {"pid":playerId, "deck": deck}
        } catch(error){
            
        }

        return result;
    }

    // Deck
    // initialize empty
    init(amount){
        this.total = amount;
        for(let i = 0; i < amount; i++){
            this.cards.push(new Card(i,i));
        }
        return this;
    }

    // init with card effect
    initWithData(amount, source, by){
        this.total = amount;
        console.log("getDeck", source);
        for(let i = 0; i < amount; i++){
            let created = new CardEffect().init(source[i], by);
            this.cards.push(created);
        }
        return this;
    }

    // Card | null
    draw(amount = 1){
        if(amount > 1){
            let draw_cards = [];

            for(let i = 0; i < amount; i++){
                draw_cards.push(this.cards.shift());
            }

            return draw_cards;
        } else if(amount == 0){
            return null;
        }
        return this.cards.shift();
    }

    // void
    shuffle(){
        for(let i = this.cards.length - 1; i > 0; i--){
            let seed = Math.floor(Math.random() * (i+1));
            // console.log(seed, this.cards[seed], this.cards[i]);
            if(this.cards[seed] != null || this.cards[seed] != undefined){
              [this.cards[i], this.cards[seed]] = [this.cards[seed], this.cards[i]];
            }
        }
    }
}

//MARK: Field
class Field {
    // define maximum
    static maxUnitZone = 3;
    static maxSupportZone = -1;

    unitZoneMap = {
        0: null,
        1: null,
        2: null,
    }

    // unlimit
    supportZoneMap = {}

    constructor(){}

    inRange(n, zoneType){
        switch(zoneType){
            case "unit":
                return n > -1 && n < 3;
            case "support":
                return n > -1;
        }
    }

    placeUnitAtSlot(card, slot){
        if(this.inRange(slot, "unit") && this.unitZoneMap[slot] == null){
            this.unitZoneMap[slot] = card;
            card.state = CARD_STATE.PLACE_TO_FIELD;
            return true;
        }
        console.error(`Illegal moves: unit existed at slot ${slot}`);
        return false;
    }

    removeUnitAtSlot(slot){
        if(this.inRange(slot, "unit") && this.unitZoneMap[slot] != null){
            this.unitZoneMap[slot] = null;
            return true;
        }
        console.error(`Ghost moves: no unit existed at slot ${slot}`);
        return false;
    }

    getStates = () => {
        let zone_states = {
            units: {
                0: this.unitZoneMap[0] == null ? CARD_STATE.UNKNOWN : this.unitZoneMap[0].state,
                1: this.unitZoneMap[1] == null ? CARD_STATE.UNKNOWN : this.unitZoneMap[1].state,
                2: this.unitZoneMap[2] == null ? CARD_STATE.UNKNOWN : this.unitZoneMap[2].state,
            },
            supports: null
        };

        return zone_states;

        
    }
}

//MARK: Player
class Player{

    playerId;

    hand = {};
    deck;
    field;
    dropzone;
    removed;

    resources;
    resource_limit;

    constructor(){}
    
    init(playerId){
        this.playerId = playerId;

        // setup
        this.field = new Field();
        this.loadDeck();
        this.dropzone = [];
        this.removed = [];

        this.resource_limit = 10;
        
        // 
        this.deck.shuffle();
        let initDraws = this.deck.draw(5);

        for(let i = 0; i < initDraws.length; i++){
            this.hand[i] = initDraws[i];
        }

        console.log("HAND: ", this.hand);

        // TODO: resource search on first turn;
        // - peek 5
        // - user may select any number of show but must not exceed resource_limit
        // - 
    }

    loadDeck(path = "default"){
        // find id and load deck recipe
        let result = Deck.tryLoadDeck(this.playerId, path);

        // if result is {} and is test mode, load dummy deck
        if(testMode){
            // console.log("getDummyDeck",getDummyDeck());
            result = getDummyDeck();
        }

        this.deck = new Deck().initWithData(40, result, this);
    }

    getHandSize = () => {
        return Object.keys(this.hand).length;
    }

    payCardCost = (cost) => {
        if(cost >= this.resources){
            return -1;
        }
        
        let res_left = this.resources - cost;
        return res_left;
    }
}

// let test_deck = new Deck().init(40);
// test_deck.shuffle();
// console.log("shuffle",test_deck);

// let my_hand = [];
// let my_field = new Field();

// start turn, draw 5
// my_hand.push(test_deck.draw(5));

// console.log("hand", my_hand, "deck", test_deck);

// // play 1 card <-- (HAND: remove at index) then (FIELD: assign to index)
// my_field[1] = my_hand[0];



// -------------------------------------------------------------------------------------------------------------------------


// init player

// let player1 = new Player();
// player1.init("001");


// // try play
// // suppose resource is at 10
// player1.resources = 10;
// // pay cost first
// let payOk = player1.payCardCost(player1.hand[0]);
// let isResolved = player1.field.placeUnitAtSlot(player1.hand[0], 1);
// console.log("HAND: ", player1.hand, "STATE: ", player1.field.getStates());
// if(payOk != -1 && isResolved){
//     // exec onPlay
//     let successPlayedUnit = player1.field.unitZoneMap[1];
//     successPlayedUnit.on(successPlayedUnit.callback.play);
//     delete player1.hand[0];
// }

// console.log("HAND: ", player1.hand, "DECK: ", player1.deck,"FIELD: ", player1.field, "STATE: ", player1.field.getStates());