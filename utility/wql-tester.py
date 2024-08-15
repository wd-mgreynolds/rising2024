from playerCentral import PlayerCentral

# Get connected to the Extend endpoint.
pc = PlayerCentral()
pc.get_access_token()

wql = "SELECT count() as rank, pcpEmailAddress, pcpFirstName, pcpLastName, pcpCompany from playercentral_mcg_qndmtj/playerProfiles WHERE ( pcpEmailAddress startswith 'mark' or pcpFirstName startswith 'mark' or pcpLastName startswith 'mark' or pcpCompany startswith 'mark') AND ( pcpEmailAddress startswith 'grey' or pcpFirstName startswith 'grey' or pcpLastName startswith 'grey' or pcpCompany startswith 'grey')"
