import sys, os, random
import pandas as pd
from datetime import datetime, timezone

sys.path.append(sys.path[0] + '/../player-central/extend')
from extend import Extend

# Get connected to the Extend endpoint.
pc = Extend()

# Get all the avaialable players.
profiles = pc.get_profiles()

# Get a random player.
player = profiles.iloc[random.randrange(len(profiles))]

create_ts = datetime.now()
curCreated = create_ts.isoformat()
curStatus = "Queued"
curElapsed = 0
curBegins = None
curEnds = None

input_vars = {
    "profileId" : player["id"],
    "status" : curStatus,
    "created" : curCreated,
    "begins" : curBegins,
    "ends" : curEnds,
    "elapsed" : curElapsed
}

newEvent = pc.write_event_gql(input_vars)

print(newEvent)
