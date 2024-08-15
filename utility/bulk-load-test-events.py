import sys, os, random
from datetime import datetime
import pandas as pd

sys.path.append(sys.path[0] + '/../player-central/extend')
from extend import Extend

# Get connected to the Extend endpoint.
pc = Extend()

profiles = pc.get_profiles();

for indx, profile in profiles.iterrows():
    # Only try if there are events assocated with the profile.
    if "pcpEvents" in profile and isinstance(profile["pcpEvents"], list):
        input = {
            "profileId" : profile["id"],
            "companyId" : profile["pcpCompany"]["id"],
            "firstName" : profile["pcpFirstName"],
            "lastName" : profile["pcpLastName"],
            "events" : []
        }
        
        print(pc.update_profile_gql(input))
    
pc.delete_events()

# Get all the avaialable players.
profiles = pc.get_profiles()

status_indx = 0

for play in range(0, 120):
    print(play)
    
    # Get a random player.
    player = profiles.iloc[random.randrange(len(profiles))]

    status_indx += 1
    
    if status_indx > 20:
        status_indx = 1

    create_ts = datetime.now()
    curCreated = create_ts.isoformat()

    if status_indx <=  17:
        curStatus = "Played"
        curElapsed = random.randrange(30000, 80000, 100)
        curBegins = "2024-06-03T16:21:21.425Z"
        curEnds = "2024-06-03T16:21:21.425Z"
    elif status_indx == 18:
        curStatus = "Queued"
        curElapsed = 0
        curBegins = None
        curEnds = None
    elif status_indx == 19:
        curStatus = "Skipped"
        curElapsed = 0
        curBegins = None
        curEnds = None
    else:
        curStatus = "Playing"
        curElapsed = 0
        curBegins = "2024-06-03T16:21:21.425Z"
        curEnds = None
        
    # Put them in the queue.
    input_vars = {
        "profileId" : player["id"],
        "status" : curStatus,
        "created" : curCreated,
        "begins" : curBegins,
        "ends" : curEnds,
        "elapsed" : curElapsed
    }
    
    newEvent = pc.write_event_gql(input_vars)
    
    newEventData = newEvent['data']['playercentral_mcg_qndmtj_createPlayerEvent']
    
    newEventId = newEventData["workdayID"]["id"]
    
    # Add this new event id to the profile and update
    # the profile.
    
    if "pcpEvents" in player and isinstance(player["pcpEvents"], list):
        player_events = player["pcpEvents"]
    else:
        player_events = []

    player_events.append({ "id" : { "id" : newEventId, "type" : "WID" } })
    
    player["pcpEvents"] = player_events
    
    player_input = {
        "profileId" : player["id"],
        "companyId" : player["pcpCompany"]["id"],
        "firstName" : player["pcpFirstName"],
        "lastName" : player["pcpLastName"],
        "events" : player["pcpEvents"]
    }
    
    print(pc.update_profile_gql(player_input))
        
