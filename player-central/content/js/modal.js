"use strict"

// Setup the operation of the Confirm modal dialog.
const confirmModal = document.getElementById("confirmModal");
const confirmClose = document.getElementById("confirmModalClose");
const confirmCancel = document.getElementById("confirmModalCancel");
const confirmSubmit = document.getElementById("confirmModalSubmit");
const confirmCompany = document.getElementById("confirmCompany");
const confirmPlayer = document.getElementById("confirmName");
const confirmTime = document.getElementById("confirmTime");

function confirmModalIsOpen() {
  return confirmModal.style.display === "block"
}

function confirmModalOpen() {
  // Load the player information into the dialog.
  //confirmCompany.textContent = playerCompany.textContent;
  //confirmPlayer.textContent = playerName.textContent;
  confirmTime.textContent = playerTime.textContent;

  // Show the modal dialog.
  confirmModal.style.display = "block";
}

function confirmModalClose() {
  confirmModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
confirmClose.onclick = function () {
  confirmModalClose();
}

confirmCancel.onclick = function () {
  // NOTE: this operation also happend in the stopwatch.js
  // when the user pushes the button when the dialog is open.
  confirmModal.style.display = "none";
}

confirmSubmit.onclick = function () {
  submitEvent();
}

// Setup the operation of the requeue modal dialog.
const requeueModal = document.getElementById("requeueModal");
const requeueClose = document.getElementById("requeueModalClose");
const requeueCancel = document.getElementById("requeueModalCancel");
const requeueRequeue = document.getElementById("requeueModalRequeue");
//const requeueCompany = document.getElementById("requeueCompany");
//const requeuePlayer = document.getElementById("requeueName");

function requeueModalIsOpen() {
  return requeueModal.style.display === "block"
}

function requeueModalOpen() {
  // Load the player information into the dialog.
  //requeueCompany.textContent = playerCompany.textContent;
  //requeuePlayer.textContent = playerName.textContent;

  // Show the modal dialog.
  requeueModal.style.display = "block";
}

function requeueModalClose() {
  requeueModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
requeueClose.onclick = function () {
  requeueModalClose();
}

requeueCancel.onclick = function () {
  // NOTE: this operation also happend in the stopwatch.js
  // when the user pushes the button when the dialog is open.
  requeueModal.style.display = "none";
}

requeueRequeue.onclick = function () {
  requeueEvent();
}


// Setup the operation of the Cancel modal dialog.
const cancelModal = document.getElementById("cancelModal");
const cancelClose = document.getElementById("cancelModalClose");
const cancelCancel = document.getElementById("cancelModalCancel");
const cancelReset = document.getElementById("cancelModalReset");
const cancelSkip = document.getElementById("cancelModalSkip");
//const cancelCompany = document.getElementById("cancelCompany");
//const cancelName = document.getElementById("cancelName");

function cancelModalIsOpen() {
  // Load the player information into the dialog.
  return cancelModal.style.display === "block"
}

function cancelModalOpen() {
  //cancelCompany.textContent = playerCompany.textContent;
  //cancelName.textContent = playerName.textContent;

  cancelModal.style.display = "block";
}

function cancelModalClose() {
  cancelModal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
cancelClose.onclick = function () {
  cancelClose();
}

cancelCancel.onclick = function () {
  // NOTE: this operation also happens in the stopwatch.js
  // when the user pushes the button when the dialog is open.
  cancelModal.style.display = "none";
}

cancelReset.onclick = function () {
  // NOTE: this is the same operations as double-press in stopwatch.js
  resetPlay();
}

cancelSkip.onclick = function () {
  cancelEvent();
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == confirmClose) {
    confirmClose.style.display = "none";
  }
}

// Handle ESC key (key code 27)
document.addEventListener('keyup', function (e) {
  if (e.keyCode == 27 && confirmModal.style.display == "block") {
    confirmModal.style.display = "none";
  }

  if (e.keyCode == 27 && requeueModal.style.display == "block") {
    requeueModal.style.display = "none";
  }

  if (e.keyCode == 27 && cancelModal.style.display == "block") {
    cancelModal.style.display = "none";
  }
});

document.addEventListener('keyup', function (e) {
  if (e.keyCode == 27 && cancelModal.style.display == "block") {
    cancelModal.style.display = "none";
  }
});