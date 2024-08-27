import sys, os
import pandas as pd

sys.path.append(sys.path[0] + "/../player-central/extend")
from extend import Extend

# Get connected to the Extend endpoint.
pc = Extend()


def delete_all():
    total_ref = 0

    # Clean-up referential integrity.
    companies = pc.get_all_objects_gql("PlayerCompany", "queryCompanies")

    if len(companies) > 0:
        # For each company with profiles, patch to remove the profiles.
        # This is pretty stupid.

        companies_w_profiles = companies[companies["pccProfiles"].notnull()]
        bulk_data = {"data": []}

        for company in companies_w_profiles["workdayID"]:
            if len(bulk_data["data"]) == 100:
                total_ref += 100

                print(f"Removed profile references for 100 companies ({total_ref})")
                pc.patch_company_bulk(bulk_data)
                bulk_data = {"data": []}

            bulk_data["data"].append({"id": company["id"], "pccProfiles": []})

        if len(bulk_data["data"]) > 0:
            total_ref += len(bulk_data["data"])
            print(
                f'Removed profile references for {len(bulk_data["data"])} companies ({total_ref})'
            )

            pc.patch_company_bulk(bulk_data)

    # Clean up the prior load.
    pc.delete_events()
    pc.delete_profiles()
    pc.delete_companies()


def load_csv():
    # Load the provided attendees from CSV.
    attendee_df = pd.read_csv(
        os.path.join(sys.path[0], "../../attendees/attendees.csv")
    )
    attendee_df.dropna(how="all", inplace=True)

    # Get the distinct list of companies from the list of attendees.
    # IMPORTANT: cannot use primary key in object def - case sensitive
    company_list = attendee_df["Company"].unique()

    # Create the bulk data object to send on the REST call.
    bulk_data = {"data": []}

    for company in company_list:
        if not isinstance(company, str) or company == "SUMMARIES":
            continue

        new_company = {
            "pccCompanyName": company,
        }

        # Full page (max 100 items allowed)?
        if len(bulk_data["data"]) == 100:
            print("Write company batch")
            pc.write_company_batch(bulk_data)
            bulk_data = {"data": []}

        bulk_data["data"].append(new_company)

    # Any left-over companies?  Write them.
    if len(bulk_data["data"]) > 0:
        print(f'Write company final page - {len(bulk_data["data"])}')
        pc.write_company_batch(bulk_data)

    # Re-pull ALL the companies to ensure we have the Workday IDs
    # to use on the profiles.
    companies = pc.get_companies()

    # We are ready to load profiles.  Loop over
    # the attendees in groups of 100 (max batch).
    data = {"data": []}

    for index, profile in attendee_df.iterrows():
        # Skip folks who could not attend, and by definition cannot play.
        if profile["Campaign Name"] not in [
            "24-05-GL-na-us-ris-alp-PX-Rising24_In_Person-coev-regi"
        ]:
            continue

        lookup_company = companies.loc[
            companies["pccCompanyName"] == profile["Company"]
        ]

        if len(lookup_company) == 1:
            # Pull the first item, but don't use an index because array is sparse and item "0" may not exist
            cIter = iter(lookup_company["id"])

            # Create the new profile with a single-instance reference to the company.
            new_profile = {
                "pcpFirstName": profile["First Name"],
                "pcpLastName": profile["Last Name"],
                "pcpCompany": {"id": next(cIter)},
            }

            if len(data["data"]) == 100:
                print("Write profile batch")
                pc.write_profile_batch(data)
                data = {"data": []}

            data["data"].append(new_profile)
        else:
            print(profile["Company"])
            print("skipped due to missing company.")

    if len(data["data"]) > 0:
        print(f'Write final profile page - {len(data["data"])}')
        pc.write_profile_batch(data)


delete_all()
load_csv()

# Now manually set the referential integrity from the profiles to the companies.
# This is a many->one relationship of profiles related to a company.
# This is also stupid.

companies = {}

# Collect the profiles per company by iterating over profiles
# and adding them to a company.
profiles = pc.get_profiles()

for index, profile in profiles.iterrows():
    # Assume every profile has a company!!!  This should be true from
    # the loading above.
    company_id = profile["pcpCompany"]["id"]

    if company_id not in companies:
        # New company detected
        companies[company_id] = []

    # Add the profile to the company.
    companies[company_id].append({"id": profile["id"]})

# Loop over the companies and update the multi-instance
# of profiles, i.e., each company has zero or more profiles.

bulk_data = {"data": []}

for company in companies:
    if len(bulk_data["data"]) == 100:
        print("Write company.pccProfiles multi-instance batch")
        pc.patch_company_bulk(bulk_data)
        bulk_data = {"data": []}  # Reset the batch collector

    # Add this company.pccProfiles multi-instance.
    bulk_data["data"].append({"id": company, "pccProfiles": companies[company]})

if len(bulk_data["data"]) > 0:
    print("Write company.pccProfiles multi-instance final page")
    pc.patch_company_bulk(bulk_data)
