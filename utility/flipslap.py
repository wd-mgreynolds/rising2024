import sys, os

sys.path.append(sys.path[0] + "/../player-central/extend")
from extend import Extend

def remove_ref_integrity(group):
    groupId = group.workdayID['id']
    
    if group.pfsgMessages != None:
        print(pc.update_flipslap_group_ref(groupId))

def delete_group(group):
    groupId = group.workdayID['id']
    
    if group.pfsgMessages != None:
        for line in group.pfsgMessages['data']:
            print(pc.delete_flipslap_line(line['workdayID']['id']))
        
    print(pc.delete_flipslap_group(groupId))

def delete_line(line):
    lineId = line.workdayID['id']
    print(pc.delete_flipslap_line(lineId))
    
# Get connected to the Extend endpoint.
pc = Extend()

# Get the full list of defined messages.
groups = pc.get_all_objects_gql("PlayerFlipSlapGroups", "queryFlipSlapGroups")
print(groups)

# Remove the MULTI-INSTANCE referential integrity from the groups.
groups.apply(remove_ref_integrity, axis=1)

# Get and remove ALL lines so that nothing is referencing a group.
lines = pc.get_all_objects_gql("PlayerFlipSlapLines", "queryFlipSlapLines")
print(lines)

lines.apply(delete_line, axis=1)

# Finally, remove the groups.
groups.apply(delete_group, axis=1)
