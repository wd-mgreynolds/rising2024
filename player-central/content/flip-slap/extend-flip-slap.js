let groupIndx = 0;
let groups = [];

const board = new Board(document.querySelector('#board'), {
  count: 4,
  size: 15,
  delay: 4,
})

const getMessages = (group) => {
  // Always return 4 lines for the board.
  let lines = [ "", "", "", ""];

  const info = document.getElementById("groupInfo");
  info.textContent = group.pfsgGroupName;

  if (group.pfsgMessages) {
    for (const msg of group.pfsgMessages['data']) {
      // Map the line order from Extend to the position
      // on the flip-slap board.
      lines[msg.pfslMessageLineOrder - 1] = msg.pfslMessageLine;
    }
  }

  return lines;
}

function displayCurrentGroup() {
  // Default to 10 seconds of hang time - just in case
  // a message does NOT have a display seconds value.
  let groupDelayMS = 0;

  if (groupIndx == groups.length) {
    // After we exhaust the groups, ask for a new list.
    setTimeout(updateGroups);
  } else {
    const group = groups[groupIndx];
    groupIndx++;

    if (group.pfsgEnabled) {
      // Set the hang-time for this group.
      groupDelayMS = group.pfsgDisplaySeconds * 1000;

      board.updateMessages(getMessages(group));
    }

    // Wait for the next message
    setTimeout(displayCurrentGroup, groupDelayMS);
  }
}

async function updateGroups() {
  groups = await makeApiCall('/flip-slap')
  groupIndx = 0;

  displayCurrentGroup();
}

async function makeApiCall(url) {
  const response = await fetch(url, {
    method: 'get',
  })
  const data = await response.json();
  return data.sort((a,b) => parseInt(a.pfsgGroupOrder,10) - parseInt(b.pfsgGroupOrder,10))
}

updateGroups()