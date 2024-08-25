import requests
import pandas as pd
import json
import base64
import configparser
import pathlib
import os
import sys
import re
import math
import urllib.parse

from datetime import datetime, timezone


class Extend:

    def __init__(self):
        # Bring in the Extend location and security information.
        self.extend_path = pathlib.Path(__file__).parent.resolve()

        config_file = os.environ.get("EXTEND_INI", "extend.ini")
        
        config = configparser.ConfigParser()
        config.read(config_file)

        # Begin configuring this instance based on the configuration.
        self.server = config.get("extend", "server")
        self.app = config.get("extend", "app")
        self.tenant_alias = config.get("extend", "tenant_alias")

        self.client_id = config.get("extend", "client_id")
        self.client_secret = config.get("extend", "client_secret")

        self.encoded_client = base64.b64encode(
            (self.client_id + ":" + self.client_secret).encode("ascii")
        ).decode("utf-8")

        self.api = f"https://{self.server}"
        self.wql_uri = f"{self.api}/wql/v1"
        self.token_uri = f"https://auth.{self.server}/v1/token"
        self.auth_uri = f"{self.api}/v1/authorize"
        self.app_url = f"{self.api}/apps/{self.app}/v1"
        self.graph_url = "https://api.workday.com/graphql/v1"
        self.orch_url = f"{self.api}/orchestrate/v1/apps/{self.app}/orchestrations/"

        self.companies_url = f"{self.app_url}/playerCompanies"
        self.companies_bulk_url = f"{self.companies_url}?bulk=true"

        self.profiles_url = f"{self.app_url}/playerProfiles"
        self.profiles_bulk_url = f"{self.profiles_url}?bulk=true"

        self.events_url = f"{self.app_url}/playerEvents"
        self.events_bulk_url = f"{self.events_url}?bulk=true"

        self.access_token = None
        self.token_ts = None
        self.is_successful = False

    def get_full_path(self, filename):
        return os.path.join(self.extend_path, filename)

    def get_gql_file(self, gql_file):
        try:
            with open(self.get_full_path(gql_file), "r") as f:
                gql_text = f.read()
        except Exception as e:
            print(e)
            gql_text = ""

        gql_text = re.sub(
            r"\n\s*", " ", gql_text
        )  # Get rid of new lines and any leading spaces
        gql_json = json.loads(gql_text)

        return gql_json

    def get_access_token(self):
        if self.access_token is not None:
            minutes_diff = (datetime.now() - self.token_ts).total_seconds() / 60.0

            if minutes_diff < 40:
                return self.access_token

        headers = {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"ID {self.encoded_client}",
        }

        data = {"grant_type": "client_credentials", "tenant_alias": self.tenant_alias}

        try:
            resp = requests.request("POST", self.token_uri, data=data, headers=headers)

            if resp.status_code == 200:
                self.access_token = resp.json()["access_token"]
                self.token_ts = datetime.now()

                return self.access_token
        except Exception as e:
            print(e)

        return None

    def get_headers(self):
        return {"Authorization": f"Bearer {self.get_access_token()}"}

    def get_all_rows_rest(self, url):
        offset = 0
        objects = []

        while True:
            page_url = url + f"?limit=100&offset={offset}"

            r = requests.get(page_url, headers=self.get_headers())
            r.raise_for_status()

            object_json = r.json()
            objects.extend(object_json["data"])

            if len(object_json["data"]) != 100:
                break

            offset += 100

        df = pd.DataFrame(objects)

        return df

    def get_all_rows_wql(self, query):
        wql_query = urllib.parse.quote_plus(query.replace("\n","").strip())
        
        offset = 0
        objects = []

        while True:
            page_url = self.wql_uri + f"/data?query={wql_query}&limit=10000&offset={offset}"

            r = requests.get(page_url, headers=self.get_headers())
            r.raise_for_status()

            object_json = r.json()
            objects.extend(object_json["data"])

            if len(object_json["data"]) != 10000:
                break

            offset += 10000

        df = pd.DataFrame(objects)

        return df

    def delete_all_rest(self, url, objects):
        if len(objects) == 0:
            return

        # Compute the max number of 100 row pages.
        pages = math.floor(len(objects) / 100) + 1

        for page in range(pages):
            min_object = page * 100
            max_object = min_object + 100

            if max_object > len(objects):
                max_object = len(objects)

            data = {"data": []}

            while min_object < max_object:
                data["data"].append({"id": objects["id"][min_object]})
                min_object += 1

            # Delete this page of ID values
            resp = requests.delete(
                url,
                headers=self.get_headers(),
                data=json.dumps(data),
            )

    def get_companies(self):
        return self.get_all_rows_rest(self.companies_url)

    def delete_companies(self):
        self.delete_all_rest(self.companies_bulk_url, self.get_companies())

    def get_all_objects_gql(self, object_name, query_name):
        gql_json = self.get_gql_file(f"graphql/{query_name}.gql")

        parameters = gql_json["parameters"] if "parameters" in gql_json else None
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else {}

        url = "https://api.workday.com/graphql/v1"

        # Load all the pages of racers - we will use this to
        # ensure we do not duplicate any entries.
        offset = 0
        page_size = 100
        total_objects = -1
        
        objects = []

        while True:
            variables["limit"] = page_size
            variables["offset"] = offset

            api_body = {"query": re.sub(r"\n\s+", " ", query), "variables": variables}

            r = requests.post(url, headers=self.get_headers(), data=json.dumps(api_body))
            r.raise_for_status()

            page_json = r.json()
            object_data = page_json["data"][f"{self.app}_{object_name}"]
            
            # Lazy set of the total objects coming from the first page results.
            if total_objects == -1:
                total_objects = object_data["total"]
                
            objects.extend(object_data["data"])

            # As soon as we get a partial page, we are done.
            if offset + page_size >= total_objects:
                break

            offset += page_size

        df = pd.DataFrame(objects)

        return df

    def delete_company(self, id):
        headers = {"Authorization": f"Bearer {self.access_token}"}
        url = "https://api.workday.com/apps/playercentral_mcg_qndmtj/v1/playerCompanies"
        url += "?bulk=true"

        data = {"data": [{"id": id.values[0]}]}

        resp = requests.delete(url, headers=headers, data=json.dumps(data))

    def write_company(self, company):
        headers = {"Authorization": f"Bearer {self.access_token}"}

        url = "https://api.workday.com/apps/playercentral_mcg_qndmtj/v1/playerCompanies"

        data = {"pccCompanyName": company}

        resp = requests.post(url, data=json.dumps(data), headers=headers)

        print(resp)

    def write_company_batch(self, companies):
        headers = {"Authorization": f"Bearer {self.access_token}"}

        url = "https://api.workday.com/apps/playercentral_mcg_qndmtj/v1/playerCompanies?bulk=true"

        resp = requests.post(url, data=json.dumps(companies), headers=headers)

        if resp.status_code == 500:
            print(resp.text)

    def patch_company(self, id, data):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = "https://api.workday.com/apps/playercentral_mcg_qndmtj/v1/playerCompanies"
        url += "/" + id

        resp = requests.patch(url, data=json.dumps(data), headers=headers)

        if resp.status_code == 500:
            print(resp.text)

    def patch_company_bulk(self, data):
        resp = requests.patch(self.companies_bulk_url, data=json.dumps(data), headers=self.get_headers())

        if resp.status_code == 500:
            print(resp.text)

    def patch_company_gql(self, id, data):
        headers = {"Authorization": f"Bearer {self.access_token}"}

        url = "https://api.workday.com/apps/playercentral_mcg_qndmtj/v1/playerCompanies"
        url += "/" + id

        resp = requests.patch(url, data=json.dumps(data), headers=headers)

        if resp.status_code == 500:
            print(resp.text)

    def get_profiles(self):
        return self.get_all_rows_rest(self.profiles_url)

    def get_profiles_wql(self):
        wql = f'''
                select workdayID,
                       pcpFirstName,
                       pcpLastName,
                       pcpCompanyName,
                       pcpCompany,
                       pcpEvents
                from {self.app}_playerProfiles
        '''
        
        return self.get_all_rows_wql(wql)

    def write_profile(self, profile):
        resp = requests.post(self.profiles_url, data=json.dumps(profile), headers=self.get_headers())

        print(resp)

    def update_profile_gql(self, input):
        gql_json = self.get_gql_file("graphql/mutationUpdatePlayerProfile.gql")
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else {}
    
        variables["playerProfilesId"]["id"] = input["profileId"]
        variables["input"]["pcpCompany"]["id"]["id"] = input["companyId"]
        variables["input"]["pcpFirstName"] = input["firstName"]
        variables["input"]["pcpLastName"] = input["lastName"]
        variables["input"]["pcpEvents"] = input["events"]
        
        api_body = {"query": re.sub(r"\n\s+", " ", query), "variables": variables}
        
        r = requests.post(self.graph_url, headers=self.get_headers(), data=json.dumps(api_body))
        r.raise_for_status()
        
        return r.json()

        resp = requests.post(self.profiles_url, data=json.dumps(profile), headers=self.get_headers())

        print(resp)

    def write_profile_batch(self, profiles):
        resp = requests.post(self.profiles_bulk_url, data=json.dumps(profiles), headers=self.get_headers())

        if resp.status_code != 207:
            print(resp.status_code)
            print(resp.text)

    def update_flipslap_group_ref(self, groupId):
        gql_json = self.get_gql_file("graphql/mutationUpdateFlipSlapGroupMessages.gql")
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else {}
    
        variables["groupId"]["id"] = groupId
        variables["input"]["pfsgMessages"] = []
        
        api_body = {"query": re.sub(r"\n\s+", " ", query), "variables": variables}
        
        r = requests.post(self.graph_url, headers=self.get_headers(), data=json.dumps(api_body))
        r.raise_for_status()
        
        return r.json()
    
    def delete_flipslap_group(self, groupId):
        gql_json = self.get_gql_file("graphql/mutationDeleteFlipSlapGroup.gql")
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else {}
    
        variables["groupId"]["id"] = groupId
        
        api_body = {"query": re.sub(r"\n\s+", " ", query), "variables": variables}
        
        r = requests.post(self.graph_url, headers=self.get_headers(), data=json.dumps(api_body))
        r.raise_for_status()
        
        return r.json()


    def delete_flipslap_line(self, lineId):
        gql_json = self.get_gql_file("graphql/mutationDeleteFlipSlapLine.gql")
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else {}
    
        variables["lineId"]["id"] = lineId
        
        api_body = {"query": re.sub(r"\n\s+", " ", query), "variables": variables}
        
        r = requests.post(self.graph_url, headers=self.get_headers(), data=json.dumps(api_body))
        r.raise_for_status()
        
        return r.json()

        
    def write_event_gql(self, input_vars):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = "https://api.workday.com/graphql/v1"

        gql_json = self.get_gql_file("graphql/mutationCreatePlayerEvent.gql")

        parameters = gql_json["parameters"] if "parameters" in gql_json else {}
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else {}

        variables["createPlayerEvent_input"]["pceProfile"]["id"]["id"] = input_vars["profileId"]
        variables["createPlayerEvent_input"]["pceCreated"] = input_vars["created"]
        variables["createPlayerEvent_input"]["pceBegins"] = input_vars["begins"]
        variables["createPlayerEvent_input"]["pceEnds"] = input_vars["ends"]
        variables["createPlayerEvent_input"]["pceElapsed"] = input_vars["elapsed"]
        variables["createPlayerEvent_input"]["pceStatus"] = input_vars["status"]

        api_body = {"query": re.sub(r"\n\s+", " ", query), "variables": variables}

        r = requests.post(url, headers=headers, data=json.dumps(api_body))
        r.raise_for_status()

        return r.json()

    def delete_profiles(self):
        self.delete_all_rest(self.profiles_bulk_url, self.get_profiles())

    def get_events(self):
        return self.get_all_rows_rest(self.events_url)
        
    def get_best_time_wql(self):
        self.get_access_token()
        headers = {"Authorization": f"Bearer {self.access_token}"}

        # Use WQL so we can do the MIN() aggregation.
        wql = f"select min(pceElapsed) as best_time from {self.app}_playerEvents where pceStatus = 'Played' and pceElapsed > 0"
        wql = urllib.parse.quote_plus(wql)

        url = f"{self.wql_uri}/data?query={wql}"

        resp = requests.get(url, headers=headers)

        if resp.status_code == 200:
            resp_json = resp.json()

            if resp_json["total"] == 0:
                return "0"  # Valid query, but there are no non-zero elapsed times.
            else:
                return resp_json["data"][0]["best_time"]
        else:
            return "0"

    def get_events_gql(self):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = "https://api.workday.com/graphql/v1"

        gql_json = self.get_gql_file("graphql/queryEvents.gql")

        parameters = gql_json["parameters"] if "parameters" in gql_json else None
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else None

        offset = 0
        events = []

        variables["event_limit"] = 100

        while True:
            variables["event_offset"] = offset

            api_body = {"query": query, "variables": variables}

            r = requests.post(url, headers=headers, data=json.dumps(api_body))
            r.raise_for_status()

            event_json = r.json()
            event_list = event_json["data"]["playercentral_mcg_qndmtj_PlayerEvent"][
                "data"
            ]
            events.extend(event_list)

            if len(event_list) != 100:
                break

            offset += 100

        df = pd.DataFrame(events)

        if len(df) > 0:
            df = df.sort_values(by=["pceCreated"])

        return df

    def get_events_by_status_gql(self, status):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = "https://api.workday.com/graphql/v1"

        gql_json = self.get_gql_file("graphql/queryEventsByStatus.gql")

        parameters = gql_json["parameters"] if "parameters" in gql_json else None
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else None

        variables["event_limit"] = 100
        variables["event_where"]["pceStatus"]["eq"] = status
        
        offset = 0
        events = []

        while True:
            variables["event_offset"] = offset

            api_body = {"query": query, "variables": variables}

            r = requests.post(url, headers=headers, data=json.dumps(api_body))
            r.raise_for_status()

            event_json = r.json()
            event_list = event_json["data"]["playercentral_mcg_qndmtj_PlayerEvent"][
                "data"
            ]
            events.extend(event_list)

            if len(event_list) != 100:
                break

            offset += 100

        df = pd.DataFrame(events)

        if len(df) > 0:
            df = df.sort_values(by=["pceCreated"])

        return df

    def update_event_status_gql(self, input_parameters):
        headers = {"Authorization": f"Bearer {self.access_token}"}
        url = "https://api.workday.com/graphql/v1"

        gql_json = self.get_gql_file("graphql/mutationEventStatus.gql")

        # Parse the GQL file into the same pieces as Extend.
        parameters = gql_json["parameters"] if "parameters" in gql_json else None
        query = gql_json["query"].strip()
        variables = gql_json["variables"] if "variables" in gql_json else None

        variables["playerEventsId"]["id"] = input_parameters["id"]
        variables["updatePlayerEvent_input"]["pceBegins"] = input_parameters["begins"]
        variables["updatePlayerEvent_input"]["pceEnds"] = input_parameters["ends"]
        variables["updatePlayerEvent_input"]["pceStatus"] = input_parameters["status"]
        variables["updatePlayerEvent_input"]["pceElapsed"] = input_parameters["elapsed"]

        api_body = {"query": query, "variables": variables}

        r = requests.post(url, headers=headers, data=json.dumps(api_body))
        r.raise_for_status()

        event_json = r.json()

        updated_event = event_json["data"]["playercentral_mcg_qndmtj_updatePlayerEvent"]

        # Now call the orchestration to update Prism.
        url = self.orch_url + "LoadEventToPrism/launch"
        data = { "eventID" : input_parameters["id"] }
        r = requests.post(url, headers=headers, data=json.dumps(data))
        r.raise_for_status()
        
        return updated_event

    def delete_events(self):
        self.delete_all_rest(self.events_bulk_url, self.get_events())

    def get_image(self, id):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = f"{self.api}/apps/{self.app}/v1/playerCentralImages"
        url += "/" + id

        resp = requests.get(url, headers=headers)

        return resp.json()

    def get_images_list(self):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = f"{self.api}/apps/{self.app}/v1/playerCentralImages"

        resp = requests.get(url, headers=headers)

        return resp.json()

    def delete_image(self, id):
        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        url = f"{self.api}/apps/{self.app}/v1/playerCentralImages"
        url += "/" + id

        resp = requests.delete(url, headers=headers)

        return resp.json()

    def upload_image(self, imageName, fqfn):
        url = f"{self.api}/apps/{self.app}/v1/playerCentralImages"

        headers = {"Authorization": f"Bearer {self.get_access_token()}"}

        data = {"file": [{"file": "cid:filedata"}]}

        file = {"filedata": (imageName, open(fqfn, "rb"), "image/png")}

        resp = requests.post(url, headers=headers, files=file)

        return resp.json()

    # Returns boolean for successful token
    def access_token_successful(self):
        return self.is_successful

    # Setter for access token
    def set_access_token(self, token):
        self.access_token = token
        if not token:
            self.is_successful = False
        else:
            self.is_successful = True

    # Returns a json string 'string_json' after making REST call
    def api_req(self, endpoint="performanceManagement/v1/workers"):
        print("Sending HTTP GET request to " + endpoint + "...")

        if self.access_token_successful():
            headers = {"Authorization": "Bearer " + self.access_token}
            json_obj = requests.get(self.api + endpoint, headers=headers).json()
            string_json = json.dumps(
                json_obj, indent=4, sort_keys=True
            )  # in pretty format

            if "error" in json_obj:
                print("Error: " + json_obj["error"])
                return
            else:
                print("Request complete")
                return string_json
        else:
            print("Access token was unsuccessful")
