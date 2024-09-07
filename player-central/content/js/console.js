"use strict"

const eventUpdateURL = "/events";  // Get all events (playing/queued/played/skipped)
const best_time_url = "/bestTime";

// Big red button contents
var bigRedButton = document.getElementById("bigRedButton");
var bigRedButtonMsg = document.getElementById("bugRedButtonMsg");

var singlePressButton = document.getElementById("singlePressButton");
var singlePressButtonLine1 = singlePressButton.getElementsByClassName("button-line-1")[0];
var singleClickMessage = document.getElementById("singleClickMessage"); // Help message on left.

var doublePressButton = document.getElementById("doublePressButton");
var doublePressButtonLine1 = doublePressButton.getElementsByClassName("button-line-1")[0];
var doubleClickMessage = document.getElementById("doubleClickMessage"); // Help message on left.

var triplePressButton = document.getElementById("triplePressButton");
var triplePressButtonLine1 = triplePressButton.getElementsByClassName("button-line-1")[0];
var tripleClickMessage = document.getElementById("tripleClickMessage"); // Help message on left.

var operationInProgress = document.getElementById("operationInProgress");

// Divs for the immediate next player.
var playerNext = document.getElementsByClassName("playerNext")[0];
var playerNextEventId = playerNext.getElementsByClassName("playerEventId")[0];
var playerNextName = playerNext.getElementsByClassName("playerName")[0];
var playerNextCompany = playerNext.getElementsByClassName("playerCompany")[0];

// Current player.
var playerCurrent = document.getElementsByClassName("playerCurrent")[0];
var playerEventId = playerCurrent.getElementsByClassName("playerEventId")[0];
var playerName = playerCurrent.getElementsByClassName("playerName")[0];
var playerCompany = playerCurrent.getElementsByClassName("playerCompany")[0];
var playerTime = playerCurrent.getElementsByClassName("playerTime")[0];
var playerBegins = playerCurrent.getElementsByClassName("playerBegins")[0];
var playerEnds = playerCurrent.getElementsByClassName("playerEnds")[0];
var playerElapsed = playerCurrent.getElementsByClassName("playerElapsed")[0];
var playerPlaying = playerCurrent.getElementsByClassName("playerPlaying")[0];

// Queue update message in lower-left of players panel.
var playerQueue = document.getElementById("playerQueueStatus");
var playerQueueSpan = playerQueue.getElementsByTagName("span")[0];

function formatElapsed(elapsed) {
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed - minutes * 60000) / 1000);
    const ms = elapsed % 1000;

    const timeStr = minutes.toString().padStart(2, '0') + ':' + 
                  seconds.toString().padStart(2, '0') + '.' +
                  ms.toString().padStart(3, '0');

    return timeStr;
}

function clearNowPlaying() {
    // Reset the Now Playing bubble.
    playerEventId.value = "none";
    playerName.textContent = "Waiting for player";
    playerCompany.textContent = "- - -";
    playerTime.textContent = "--:--.---";
}

function resetStopWatch() {
    // Clear the stopwatch counters.
    accumulatedTime = 0;

    document.getElementById('mainminute').textContent = '00';
    document.getElementById('mainsecond').textContent = '00';
    document.getElementById('milliseconds').textContent = '000';
}

function loadNextPlayer() {
    // Pull the item from the "Next Up" bubble.
    playerEventId.value = playerNextEventId.value;
    playerName.textContent = playerNextName.textContent;
    playerCompany.textContent = playerNextCompany.textContent;
    playerTime.textContent = "00:00.000";
    playerBegins.value = new Date().toISOString();

    // Don't record start time until the play begins.
    playerEnds.value = null;
    playerElapsed.value = 0;

    // Tell Extend the player has been started.
    // Take this player off the queue.
    let statusUpdate = {
        "id" : playerEventId.value,
        "begins" : playerBegins.value,
        "ends" : playerEnds.value,
        "elapsed" : parseInt(playerElapsed.value),
        "status" : "Playing"
    }

    post_event_status(statusUpdate);
}

function submitEvent() {
    // If we get a double-press and the confirmation window
    // is visible, the user is submitting the current results.

    let statusUpdate = {
        "id" : playerEventId.value,
        "begins" : playerBegins.value,
        "ends" : playerEnds.value,
        "elapsed" : parseInt(playerElapsed.value),
        "status" : "Played"
    }

    // Note: this call refreshes the queue bubbles.
    post_event_status(statusUpdate);

    // Close the dialog.
    confirmModalClose();
    playCompleteSound();

    clearNowPlaying()
    resetStopWatch();
}

function requeueEvent() {
    // If we get a double-press and the requeue window
    // is visible, the user is putting the current player
    // back on the queue.

    let requeueUpdate = {
        "id" : playerEventId.value,
        "begins" : null,
        "ends" : null,
        "elapsed" : 0,
        "status" : "Queued"
    }

    // Note: this call refreshes the queue bubbles.
    post_event_status(requeueUpdate);

    // Reset the Now Playing block.
    requeueModalClose();
    playCompleteSound();

    clearNowPlaying();
    resetStopWatch();
}

function resetPlayer() {
    playerTime.textContent = "00:00.000";
    playerElapsed.value = 0;

    playCompleteSound();
    resetStopWatch();
    cancelModalClose();
}

function cancelEvent() {
    playerEnds.value = new Date().toISOString();

    // If we get a double-press and the confirmation window
    // is visible, the user is submitting the current results.

    let skipUpdate = {
        "id" : playerEventId.value,
        "begins" : playerEnds.value,
        "ends" : playerEnds.value,
        "elapsed" : 0,
        "status" : "Skipped"
    }

    post_event_status(skipUpdate);

    cancelModalClose();
    playCompleteSound();

    clearNowPlaying();
    resetStopWatch();
}


function updateEvents(data) {
    // Filter to see if an Extend event is listed as playing right
    // now.  If we find one (or more) and this browser does not 
    // have a loaded player, automatically slot the first player 
    // into the console.  This handles the situation when the
    // browser is opened or refreshed after loading a player.

    let playingEvents = data.filter((event) =>
        event.pceStatus === "Playing"
    );

    if (playingEvents.length > 0) {
        // Check the "Now Playing" bubble to see if there is a player
        // loaded.  If not, automatically promote the first player
        // into the "Now Playing" slot.

        if (playerEventId.value === "none") {
            // Sort oldest player to go first.
            playingEvents = playingEvents.sort((a, b) => {
                let da = new Date(a.pceCreated),
                    db = new Date(b.pceCreated);
                return da - db;
            });

            playerEventId.value = playingEvents[0].workdayID.id;
            playerCompany.textContent = playingEvents[0].pceProfile.pcpCompany.pccCompanyName;
            playerName.textContent = playingEvents[0].pceProfile.pcpFullName;
        }
    }

    // Now setup the "Next Up" queued entries.
    let queuedEvents = data.filter((event) =>
        event.pceStatus === "Queued"
    );

    // Sort the queue ascending on created date (oldest first).
    queuedEvents = queuedEvents.sort((a, b) => {
        let da = new Date(a.pceCreated),
            db = new Date(b.pceCreated);
        return da - db;
    });

    // Get the next up UI elements.
    const nextUpDivs = document.getElementsByClassName("playerNext")

    // Map the top two (if present) queue items to the UI next up divs.
    // Always loop twice to refresh both "Next Up" bubbles.
    for (let item = 0; item < 2; item++) {
        const nextUp = nextUpDivs[item];

        const playerEventId = nextUp.getElementsByClassName("playerEventId")[0];
        const playerCompany = nextUp.getElementsByClassName("playerCompany")[0];
        const playerName = nextUp.getElementsByClassName("playerName")[0];

        if (item < queuedEvents.length) {
            playerEventId.value = queuedEvents[item].workdayID.id;
            playerCompany.textContent = queuedEvents[item].pceProfile.pcpCompany.pccCompanyName;
            playerName.textContent = queuedEvents[item].pceProfile.pcpFullName;
        } else {
            playerEventId.value = "none";
            playerCompany.textContent = "- - -";
            playerName.textContent = "Nobody waiting...";
        }
    };
}

function post_event_status(statusUpdate) {
    // Suspend the queue updates until we get confirmation
    // of the submit event.
    playerQueueSpan.textContent = "operation in progress...";
    eventCheckFlag = false;

    fetch("/events", {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },

        //make sure to serialize your JSON body
        body: JSON.stringify(statusUpdate)
    })
    .then(response => response.json())
    .then(data => { 
        // Since something changed something for Extend, update the queue.
        console.log(data);
        refreshEvents();
    });
}

function stopPlaying() {
    // Let the button manager know the game has stopped.
    // NOTE: this is not called directly, it's always part
    // another button operation.
    playerPlaying.value = "false";

    // Stop updating the stop watch.
    playBuzzerSound();
    clearInterval(timerInterval);
}

function submitTime() {
    // Record the time the clock was stopped as the end
    // time of the current players session.  We do this
    // everytime the clock stops.
    playerEnds.value = new Date().toISOString();

    // Throw up the modal to confirm.
    confirmModalOpen();
}

function resetPlay() {
    cancelModalOpen();
}

function getBestTime() {
    // Ask Extend for the best time of all the played events,
    // i.e., status=Played, lowest elapsed time.
    fetch(best_time_url)
    .then(res => res.json())
    .then(data => {
        let timeSpan = document.getElementById("bestTimeSpan");
        timeSpan.textContent = formatElapsed(data["best_time"]);
    })
    .catch(err => { throw err });

    // Not a super-tight loop.
    setTimeout(getBestTime, 15000)
}

function refreshEvents() {
    playerQueueSpan.textContent = 'updating...';

    fetch(eventUpdateURL)
    .then(res => res.json())
    .then(data => {
        eventCheckTS = Date.now(); // Reset timer
        eventCheckFlag = true;     // Resume checking.

        updateEvents(data);
    })
    .catch(err => { throw err });
}

// The following timer loop never exits.
var eventCheckSeconds = 20
var eventCheckFlag = true;

 // Fake timestamp to ensure the first update occurs.
var eventCheckTS = Date.now() - eventCheckSeconds * 1000;

function getEvents() {
    // If an update or operations is in-progress, do not try right now.
    if (eventCheckFlag) {
        // Only check if more than "check seconds" have elapsed.
        let queueCurrentTS = Date.now();

        // Elapsed in seconds.
        const queueElapsed = Math.floor( (queueCurrentTS - eventCheckTS) / 1000);
        playerQueueSpan.textContent = (eventCheckSeconds - queueElapsed) + " seconds";

        if (queueElapsed > eventCheckSeconds) {
            eventCheckTS = queueCurrentTS;

            // If no player is loaded, update the queue.  When the 
            // current player completes, resume updating the queue.

            if (playerEventId.value === "none") {
                // In-case it takes a long time, suspend auto update
                eventCheckFlag = false;  

                refreshEvents();
            }
        }
    }

    // Always re-invoke to continue checking queue update requirements.
    setTimeout(getEvents, 1000)
}

function buttonManager() {
    const noOpMessageHelp = '- -';
    const updateMessageHelp = 'Update the queue';
    const startMessageHelp = 'Start this play';
    const stopMessageHelp = 'Stop the timer';
    const submitMessageHelp = 'Submit this play';
    const resetMessageHelp = 'Reset timer for this play';
    const loadMessageHelp = 'Load Next Up player';
    const requeuePlayerHelp = 'Put player back on queue';
    const skipPlayerHelp = 'Skip this player';

    if (playerQueueSpan.textContent == "operation in progress...") {
        // While an operation is running, hide all the buttons.
        // NOTE: setting the noOperation functions handles disables
        // the button presses (or space bar).

        singlePressButton.style.display = "none";
        singlePressButton.onclick = noOperation;

        doublePressButton.style.display = "none";
        doublePressButton.onclick = noOperation;

        triplePressButton.style.display = "none";
        triplePressButton.onclick = noOperation;

        operationInProgress.style.display = "inline-block";

        // Super-tight loop to set the button operations.
        setTimeout(buttonManager, 100);

        return;
    }

    operationInProgress.style.display = "none";

    // Always turn on the single press button regardless of the
    // visiblity of other buttons.
    singlePressButton.style.display = "inline-block";

    // On startup, or when nobody is queued or playing
    if (playerEventId.value === "none" && playerNextEventId.value === "none") {
        bigRedButton.textContent = "Update";
        bigRedButtonMsg.textContent = "update queue";

        singlePressButtonLine1.textContent = bigRedButton.textContent;
        singlePressButton.onclick = refreshEvents;
        singleClickMessage.textContent = updateMessageHelp;

        // Even though there is no visible button, the event
        // listener still detects double and triple presses.
        doublePressButton.style.display = 'none';
        doublePressButton.onclick = noOperation;
        doubleClickMessage.textContent = noOpMessageHelp;

        triplePressButton.style.display = 'none';
        triplePressButton.onclick = noOperation;
        tripleClickMessage.textContent = noOpMessageHelp;
    } else if (playerEventId.value !== "none") {
        // We have a player loaded.  Any button click affects
        // the current player/game.

        if (playerPlaying.value === "true") {
            // The time is running NOW!
            bigRedButton.textContent = "Stop";
            bigRedButtonMsg.textContent = "stop game";

            singlePressButtonLine1.textContent = bigRedButton.textContent;
            singlePressButton.onclick = stopPlaying;
            singleClickMessage.textContent = stopMessageHelp;

            // Hide other button combinations when the game is running.
            doublePressButton.style.display = 'none';
            doublePressButton.onclick = noOperation;
            doubleClickMessage.textContent = noOpMessageHelp;

            triplePressButton.style.display = 'none';
            triplePressButton.onclick = noOperation;
            tripleClickMessage.textContent = noOpMessageHelp;
        } else if (playerElapsed.value === "0") { 
            // If they never started playing yet, or they reset the
            // elapsed to zero, their only option is to start.
            bigRedButton.textContent = "Start";
            bigRedButtonMsg.textContent = "start game";

            // All they can do is start the game.
            singlePressButtonLine1.textContent = bigRedButton.textContent;
            singlePressButton.onclick = startPlaying;
            singleClickMessage.textContent = startMessageHelp;

            doublePressButtonLine1.textContent = 'Requeue';
            doublePressButton.onclick = requeueModalOpen;
            doublePressButton.style.display = 'inline-block';
            doubleClickMessage.textContent = requeuePlayerHelp;

            triplePressButtonLine1.textContent = 'Skip';
            triplePressButton.onclick = cancelModalOpen;
            triplePressButton.style.display = 'inline-block';
            tripleClickMessage.textContent = skipPlayerHelp;
        } else {
            // They have paused the game.
            bigRedButton.textContent = "Start";
            bigRedButtonMsg.textContent = "start game";

            singlePressButtonLine1.textContent = bigRedButton.textContent;
            singlePressButton.onclick = startPlaying;
            singleClickMessage.textContent = startMessageHelp;

            doublePressButtonLine1.textContent = 'Submit';
            doublePressButton.style.display = 'inline-block';
            doublePressButton.onclick = submitTime;
            doubleClickMessage.textContent = submitMessageHelp;

            triplePressButtonLine1.textContent = 'Reset';
            triplePressButton.style.display = 'inline-block';
            triplePressButton.onclick = resetPlay;
            tripleClickMessage.textContent = resetMessageHelp;
        }
    } else {
        // There is NO CURRENT player and there is a player in 
        // the queue that has not been loaded to "Now Playing."
        bigRedButton.textContent = "Load";
        bigRedButtonMsg.textContent = "load player";

        singlePressButtonLine1.textContent = bigRedButton.textContent;
        singlePressButton.onclick = loadNextPlayer;
        singleClickMessage.textContent = loadMessageHelp;

        doublePressButtonLine1.textContent = 'Update';
        doublePressButton.style.display = 'inline-block';
        doubleClickMessage.textContent = updateMessageHelp;
        doublePressButton.onclick = refreshEvents;

        triplePressButton.style.display = 'none';
        triplePressButton.onclick = noOperation;
        tripleClickMessage.textContent = noOpMessageHelp;
    }

    // Super-tight loop to set the button operations.
    setTimeout(buttonManager, 100);
}

// Empty function to disable a double or triple press.
function noOperation() {
    // No operation.
}

// Start refreshing the button operations.
setTimeout(buttonManager);

// Start checking the queue.
setTimeout(getEvents);

// Update the best time header.
setTimeout(getBestTime);
