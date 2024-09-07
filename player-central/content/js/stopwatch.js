var accumulatedTime = 0;
var timerStarted = Date.now()  
var timerInterval;  // Hoisted embedded function defintion

// Display elements for the stopwatch.
var ms = document.getElementById('milliseconds');
var second = document.getElementById('mainsecond');
var minute = document.getElementById('mainminute');

function updateElapsedTime() {
    // Update the main timer elements as well as the
    // mini-timer next to the players name.

    const elapsedTime = compute_mm_ss_ms(accumulatedTime)

    ms.textContent = elapsedTime.milliseconds;
    second.textContent = elapsedTime.seconds;
    minute.textContent = elapsedTime.minutes;

    // Update the current player runtime.
    playerTime.textContent = elapsedTime.elapsed_str;
    playerElapsed.value = elapsedTime.elapsed;
}

function startPlaying() {
    // Start the stopwatch.

    // Quick clean up.
    stop();

    // Let the button manager know the timer is running.
    playerPlaying.value = "true";
    playCompleteSound();

    // Always measure time based on microsecond since we started
    // the timer.  Originally, we counted setTimout expirations
    // but it was inaccurate.
    timerStarted = Date.now();

    // Start the super-tight loop of the stopwatch running.
    timerInterval = setInterval(function () {
        // Get the time since this period started.
        let delta = Date.now() - timerStarted;

        // Increment the overall time for this game.  If the
        // game is paused (one tap of the button to stop), then
        // the time-out period will not be counted toward overall
        // game time.
        accumulatedTime += delta;

        updateElapsedTime();

        timerStarted = Date.now();  // Get the new delta baseline.
    }, 50);
}

// https://javascript.info/keyboard-events
let pressCount = 0;

const handleSinglePress = () => {
    // Check for any modal windows - they get
    // dismissed first.  Single-press on the
    // all modal dialogs = "Cancel".

    if (confirmModalIsOpen()) {
        confirmModalClose();
    } else if (cancelModalIsOpen()) {
        cancelModalClose();
    } else if (requeueModalIsOpen()) {
        requeueModalClose();
    } else {
        // Run whatever is loaded as onclick.
        singlePressButton.onclick.call();
    }
}

const handleDoublePress = () => {
    if (confirmModalIsOpen()) {
        submitEvent();
        updateElapsedTime();
    } else if (cancelModalIsOpen()) {
        resetPlayer();
        updateElapsedTime();
    } else if (requeueModalIsOpen()) {
        requeueEvent();
        updateElapsedTime();
    } else {
        // Run whatever is loaded as onclick.
        doublePressButton.onclick.call()
    }
}

const handleTriplePress = key => {
    if (cancelModalIsOpen()) {
        cancelEvent();
        updateElapsedTime();
    } else if (playerEventId.value !== "none" && playerElapsed.value == 0) {
        // The current loaded player has not started playing (or was
        // reset).  At this point, the user has asked to "Requeue" 
        // the player from the main page.
        cancelModalOpen();
     } else {
        cancelModalOpen();
    }
}

const timeOut = () => setTimeout(() => {
    // Always respond to keys with an async timeout so
    // we can keep checking for key presses.
    switch (pressCount) {
        case 1:
            setTimeout(handleSinglePress())
            break;
        case 2:
            setTimeout(handleDoublePress())
            break;
        case 3:
            setTimeout(handleTriplePress())
            break;
    }

    pressCount = 0;
}, 500);

const keyPress = key => {
    // If it's not the space bar, do nothing.
    if (key.keyCode !== 32) {
        return;
    }

    // If the game is running, immediately stop.
    if (playerPlaying.value === "true") {
        handleSinglePress();

        return;
    }

    pressCount += 1;

    // Start the timer waiting for additional clicks.
    if (pressCount === 1) {
        timeOut();
    }
}

window.onkeydown = event => {
    if (event.key === ' ')
        return false;
}

window.onkeyup = key => keyPress(key);

const playBuzzerSound = () => {
    try {
        play("soundBuzzer");
    } catch(error) {
        console.log("playBuzzerSound error: " + error);
    }
}

const playCompleteSound = () => {
    try {
        play("soundComplete")
    } catch(error) {
        console.log("playCompleteSound error: " + error);
    }
}

function play(element) {
    var audio = document.getElementById(element);
    audio.play();
}

function compute_mm_ss_ms(elapsed) {
    let formatted_elapsed =  { "minutes" : "00", "seconds" : "00", "milliseconds" : "000", 
                               "elapsed" : elapsed, "elapsed_str" : "00:00.000" }

    if (elapsed && elapsed > 0) {
        let minuteVal = Math.floor(elapsed / 60000); // Gives the Minute value
        let secondVal = Math.floor( (elapsed - minuteVal * 60000) / 1000); // Gives the Second values
        let msVal = elapsed % 1000; // Gives the milliseconds value

        // Zero-fill and display the values.
        formatted_elapsed.minutes = minuteVal < 10 ? "0" + minuteVal.toString() : minuteVal
        formatted_elapsed.seconds = secondVal < 10 ? "0" + secondVal.toString() : secondVal;
        formatted_elapsed.milliseconds = ("000" + msVal.toString().trim()).substr(-3);

        formatted_elapsed.elapsed_str = formatted_elapsed.minutes + ":" +
                                        formatted_elapsed.seconds + ":" +
                                        formatted_elapsed.milliseconds;
    }

    return formatted_elapsed;
}