//  micro:bit adaptation of Conways life
//  DES4990-02 SP 2021    Douglas Osborn

//  Maximize score by cycling pattern via Button A pushes 
//  Rescue critical pattern via Button B pushes 
//  Reset game after loss by shake 

// compare array to empty
function isDead () {
    return state.every((val, index) => val === deadstate[index])
}
// compare array to prior
function isSame () {
    return state.every((val, index) => val === priorstate[index])
}
// compare array to LOGO
function isLogo () {
    return state.every((val, index) => val === logo[index])
}
// get current LED display
function getState(arr: boolean[], x: number, y: number): boolean {
    return arr[x * 5 + y];
}
// set LED display values
function setState(arr: boolean[], x: number, y: number, value: boolean): void {
    arr[x * 5 + y] = value;
}
// Enable button 1
function bOneEnable(){
    if (playerLives > 0){
        inButton1 = enabled
    }
}
// Enable button 2
function bTwoEnable(){
    if (powerUps > 0 && playerLives > 0){
        inButton2 = enabled
    }
}
// reset score components after game reset
function scoreReset() {
    playerLives = 4
    powerUps = 3
    score = 0
}

function flickerLogo () {
    for (let x = 0; x <= 5; x++) {
        if (x==5){
            ledBlank.plotImage(0);
        }
        for (let x22 = 0; x22 <= 4; x22++) {
            for (let y22 = 0; y22 <= 4; y22++) {
                if (getState(logo, x22, y22)) {
                    led.plotBrightness(x22, y22, randint(128, 255)) 
                    basic.pause(20)              
                } else {
                    if (x==5){
                        led.plotBrightness(x22, y22, 0)
                    } else {
                        led.plotBrightness(x22, y22, randint(16, 64))
                        basic.pause(20) 
                    }                   
                } 
            }
        }
    }
}

// Core function
function gameOfLife () {
    for (let x3 = 0; x3 <= 4; x3++) {
        for (let y3 = 0; y3 <= 4; y3++) {
            count = 0
            // Count the live cells in the next row
            if (x3 + 1 < 5) {
                if (getState(state, x3 + 1, y3)) {
                    count += 1
                }
                if (y3 + 1 < 5 && getState(state, x3 + 1, y3 + 1)) {
                    count += 1
                }
                if (y3 - 1 >= 0 && getState(state, x3 + 1, y3 - 1)) {
                    count += 1
                }
            }
            // Count the live cells in the previous row
            if (x3 - 1 >= 0) {
                if (getState(state, x3 - 1, y3)) {
                    count += 1
                }
                if (y3 + 1 < 5 && getState(state, x3 - 1, y3 + 1)) {
                    count += 1
                }
                if (y3 - 1 >= 0 && getState(state, x3 - 1, y3 - 1)) {
                    count += 1
                }
            }
            // Count the live cells in the current row exlcuding the current position.
            if (y3 - 1 >= 0 && getState(state, x3, y3 - 1)) {
                count += 1
            }
            if (y3 + 1 < 5 && getState(state, x3, y3 + 1)) {
                count += 1
            }
            switch (count) {
                case 0: setState(result, x3, y3, false); break;
                case 1: setState(result, x3, y3, false); break;
                case 2: setState(result, x3, y3, getState(state, x3, y3)); break;
                case 3: setState(result, x3, y3, true); break;
                default: setState(result, x3, y3, false); break;
            }
        }
    }
    // Update the state
    state = result
}

// Use button A for the next iteration of game of life
input.onButtonPressed(Button.A, function () {
    if ( inButton1 ){
        inButton1 = disabled
        priorstate = state.slice()
        gameOfLife()
        checkState()
    }
})

// Use button B for reseting to random initial seed state
input.onButtonPressed(Button.B, function () {
    if ( inButton2 ) {
        inButton2 = disabled
        powerUps -= 1
        reset()
        show()
    }
})

input.onGesture(Gesture.Shake, function () {	
    if (inShake) {
        inShake = disabled
        scoreReset()
        reset()
        show()
    } 
})

// Show the ledArray based on the state
function show () {
    for (let x2 = 0; x2 <= 4; x2++) {
        for (let y2 = 0; y2 <= 4; y2++) {
            ledArray.setPixel(x2, y2, getState(state, x2, y2));
        }
    }
    ledArray.plotImage(0);
    bOneEnable()
    bTwoEnable()
}

// blink INVERSE of the lifeChart based on the state
function showERR () {
    makeErrMask()
    flashErr()
    playerLives -=1
    basic.pause(500)
    if ( playerLives < 1) {
        showScore()
    } else {
        basic.pause(80)
        reset()
        show()
    }
}

// Generate random initial state.
function reset () {
    ledBlank.plotImage(0);
    for (let x = 0; x <= 4; x++) {
        for (let y = 0; y <= 4; y++) {
            setState(state, x, y, Math.randomBoolean());
        }
    }
}

// Generate inverse screen for flashing 
function makeErrMask() {
    for (let x22 = 0; x22 <= 4; x22++) {
        for (let y22 = 0; y22 <= 4; y22++) {
            if (getState(priorstate, x22, y22)) {
                errMask.setPixel(x22, y22, false );
            } else {
                errMask.setPixel(x22, y22, true );
            }
        }
    }
}

//  do inverse screeen flash effect 
function flashErr(){
    errMask.plotImage(0);
    ledArray.plotImage(0);
    basic.pause(125)
    errMask.plotImage(0);
    basic.pause(125)
    ledArray.plotImage(0);
    basic.pause(125)
    errMask.plotImage(0);
    basic.pause(125)
    ledBlank.plotImage(0);    
}

function checkState() {
    // do free reset if current screen = logo
    if ( isLogo() ){
        makeErrMask()
        flashErr()
        reset()
        show()
    }
    // check for empty screen death
    if (isDead()) {
        showERR()
    } else {
        //  check for repeated screen death
        if (isSame()) {
            showERR()
        } else {
            //  Add to score for success 
            score += 1
            show()
        }
    }
}

function showScore() {
        basic.showString("WIN")
        let bonus = input.temperature()*2
//        basic.showNumber(bonus) 
        if (score >= bonus){
            basic.showString("x2")
            score = score * 2
        }
        basic.showNumber(score)
        flickerLogo()    
        inShake = enabled  
}
/**
 * https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
 */
let score = 0
let playerLives = 0
let powerUps = 0

let count = 0

let ledArray: Image = null
let errMask: Image = null
let ledBlank: Image = null

let logo: boolean[] = []
let deadstate: boolean[] = []
let priorstate: boolean[] = []
let state: boolean[] = []
let result: boolean[] = []

let enabled: boolean = true
let disabled: boolean = false
let inShake: boolean = disabled
let inButton1: boolean = disabled
let inButton2: boolean = disabled

ledArray = images.createImage(`
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    `)

errMask = images.createImage(`
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    `)

ledBlank = images.createImage(`
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    . . . . .
    `)

// State holds the information about pixel is live or dead
// deadstate is ALL dead
// priorstate is used to check if pattern is stable.   universe size apparently prevents blinkers
// false means dead, true means live.
// logo is used as template for flickerlogo  and to match for extra life bonus 

state = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
deadstate  = state.slice()
priorstate = state.slice()
logo = [false, true, true, true, false, true, false, false, false, true, true, true, false, true, true, true, false, false, false, true, false, true, true, true, false]

// Initial reset & show
flickerLogo()
basic.pause(2000) 
scoreReset()
reset()
show()
