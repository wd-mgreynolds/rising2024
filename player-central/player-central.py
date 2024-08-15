from flask import Flask, render_template, request, redirect, session

from extend.extend import Extend

extend = Extend()

# https://stackoverflow.com/questions/20646822/how-to-serve-static-files-in-flask
# (scroll down in blog post)

app = Flask(__name__, template_folder="content", static_folder="content")


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def _html(path):
    # Only html files have template code inside them, like include.
    if path.endswith(".html"):
        return render_template(path)

    # Serve all other files from the static folder directly.
    return app.send_static_file(path)


@app.route("/bestTime", methods=["GET"])
def events_best_time():
    # Do this as WQL so we can do a "min" aggregation.
    return {"best_time": extend.get_best_time_wql()}


@app.route("/events", methods=["GET"])
def events_get():
    if "status" in request.values:
           return extend.get_events_by_status_gql(request.values["status"]).to_json(
            orient="records"
        )
    else:
        return extend.get_events_gql().to_json(orient="records")


@app.route("/flip-slap", methods=["GET"])
def flipslap_get():
    return extend.get_all_objects_gql("PlayerFlipSlapGroups", "queryFlipSlapGroups").to_json(orient="records")


# Include both GET and POST - the browser does both on a POST.
@app.route("/events", methods=["GET", "POST"])
def handle_post():
    if request.method == "POST":
        content = request.json

        event = extend.update_event_status_gql(
            {
                "status": content["status"],
                "id": content["id"],
                "begins": content["begins"],
                "ends": content["ends"],
                "elapsed": content["elapsed"]
            }
        )

        return event
    else:
        return render_template("status.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
