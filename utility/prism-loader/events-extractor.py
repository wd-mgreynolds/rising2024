import sys
import logging
import time
import pandas as pd
import os

extend_path = os.path.join(sys.path[0], '..', '..', 'player-central', 'extend')
sys.path.append(extend_path)
from extend import Extend

# create logger


# Get connected to the Extend endpoint.
pc = Extend()

previous_fqfn = os.path.join(sys.path[0], 'events.json')

if os.path.exists(previous_fqfn):
    os.remove(previous_fqfn)
    
# Connect to the custom report RaaS endpoint
while True:
    events = pc.get_events_gql()

    if os.path.exists(previous_fqfn):
        previous_events = pd.read_json(previous_fqfn)
    else:
        previous_events = pd.DataFrame()

    if not events.equals(previous_events):
        # We have new data!
        
        # first write the new data.
        
        
    # The current load is finished - sleep before starting again.
    logger.debug("main loop sleeping...")
    time.sleep(15)
