"use strict";

var chart;
var lastEventID = "none";
var lastUpdateID = "none";
var refresh = { "dateString" : "none", "lastChange" : 0 };

function formatElapsed(elapsed) {
    let minutes = Math.floor(elapsed / 60000);
    let seconds = Math.floor((elapsed - minutes * 60000) / 1000);
    let ms = elapsed % 1000;

    let timeStr = minutes.toString().padStart(2, '0') + ':' + 
                  seconds.toString().padStart(2, '0') + '.' +
                  ms.toString().padStart(3, '0');

    return timeStr;
}

function updateEntries(entries, element, title, size, css) {
    var html = '<div class="leaderboard-div">'

    html += '<div class="leaderboard-entry leaderboard-heading ' + css + '">' + title + '</div>';

    for (let item = 0; item < size; item++) {
        html += '<div class="leaderboard-entry ' + css + '">';

        let boardItem = (item + 1)  // Circle content...
        let boardTime = "--"
        let boardName = "--"
        let boardCompany = "--"

        if (item < entries.length) {
            boardTime = formatElapsed(entries[item].pceElapsed);
            boardName = entries[item].pceProfile.pcpFullName;
            boardCompany = entries[item].pceProfile.pcpCompany.pccCompanyName;
        }

        html += '<div class="leaderboard-circle">' + boardItem + '</div>';
        html += '<div class="leaderboard-time">' + boardTime + '</div>'
        html += '<div class="leaderboard-name">' + boardName + '</div>'
        html += '<div class="leaderboard-company">' + boardCompany + '</div>'

        html += "</div>"
        html += '<div style="clear: both"></div>';
    }

    html += "</div>";

    element.innerHTML = html;
}

function updateCompanies(entries, element, title, size) {
    var html = '<div class="leaderboard-div">'

    html += '<div class="leaderboard-entry leaderboard-heading leaderboard-companies leaderboard-entry-company">' + title + '</div>';

    for (let item = 0; item < size; item++) {
        html += '<div class="leaderboard-entry leaderboard-entry-company leaderboard-entry-company">'

        let boardCompany = "--";
        let boardCount = "--";

        if (item < entries.length) {
            boardCompany = entries[item].companyName;
            boardCount = entries[item].count;
        }

        html += '<div class="leaderboard-time">' + boardCount + '</div>'
        html += '<div class="leaderboard-top-company">>> &nbsp;' + boardCompany + '</div>'

        html += "</div>"
        html += '<div style="clear: both"></div>';
    }

    html += "</div>"

    element.innerHTML = html
}

async function update_page() {
    const racers_resp = await fetch("/events?status=Played");
    const racers_text = await racers_resp.text();
    var racers_json;

    // If the report is being updated on the server, we may get
    // a blank return.
    try {
        racers_json = JSON.parse(racers_text);
    } catch {
        setTimeout(update_page, 10000)
        return;
    }

    // Remove any zero value race times - this is garbage.
    var entries = racers_json.filter((race) =>
        parseFloat(race.pceElapsed) > 0
        && race.pceStatus === "Played"
    );

    if (entries.length === 0) {
        setTimeout(update_page, 10000);
        return;
    }

    // Sort by most recent race for last racers panel.
    entries.sort((a, b) => (a.pceEnds > b.pceEnds) ? -1 : 1);

    // Test the first entry, if it hasn't changed since the last
    // update, do nothing.

    if (lastUpdateID === entries[0].workdayID.id) {
        setTimeout(update_page, 10000);
        return;
    }

    lastUpdateID = entries[0].workdayID.id;

    updateEntries(entries.slice(0, 5), 
                  document.getElementById("last5"), 
                  "Recent Racers", 
                  5,
                  "leaderboard-entry-top5")
    
    // We are currently sorted by raceDateTime, if we see a new
    // race, throw up a modal.
    show_new_race(entries[0]);

    // Count the companies
    // NOTE: select company, count(1) from entries;
    let companies = [];
    entries.forEach((play) => {
        let eventCompany = play.pceProfile.pcpCompany.pccCompanyName;
        let company = companies.find(comp => comp.companyName === eventCompany);

        if (company === undefined) {
            company = { "companyName" : eventCompany, "count" : 1 }
            companies.push(company);
        } else {
            company.count++;
        }
    });

    // Order by most races by company decending.
    companies.sort((a, b) => b.count > a.count ? 1 : -1);
    updateCompanies(companies.slice(0, 4),
                    document.getElementById("topCompanies"),
                    "Top Companies",
                    4);

    // Sort by best time for main leaderboard.
    entries.sort((a, b) => (parseFloat(a.pceElapsed) > parseFloat(b.pceElapsed)) ? 1 : -1);

    let title = "Time to beat: " + formatElapsed(entries[0].pceElapsed);

    updateEntries(entries.slice(0, 10), 
                  document.getElementById("top10"),
                  title,
                  10,
                  "leaderboard-entry-top10");

    // Set a time to update the page in 15 seconds
    setTimeout(update_page, 10000)
}

function show_new_race(event) {
    // On the first load, there may be no data...
    if (event === undefined) {
        return;
    }

    var eventID = event.workdayID.id;

    // Set the last event so we don't pop-up on the
    // initial load of the leaderboard.
    if (lastEventID == "none") {
        lastEventID = eventID;
    }

    // Has a new racer arrived?
    if (eventID != lastEventID) {
        lastEventID = eventID;

        document.getElementById("newRacerName").innerHTML = event.pceProfile.pcpFullName;
        document.getElementById("newRaceTime").innerHTML = "Time: " + formatElapsed(event.pceElapsed);
        document.getElementById("newRaceCompany").innerHTML = event.pceProfile.pcpCompany.pccCompanyName;

        document.getElementById("newRace").style.display = "block";

        // Set a timer to close the window after 8 seconds.
        setTimeout(function () {
            document.getElementById("newRace").style.display = "none";
        }, 8000)
    }
}

async function update_refresh() {
    refresh.lastChange += 1;

    if (refresh.lastChange > 3) {
        document.getElementById("refreshWarning").style.display = "block"
    }

    const refresh_resp = await fetch("report.date.txt")
            .then((res) => {
                if (res.ok) return res.text();
                else return "missing";
            });

    if (refresh_resp === 'missing') {
        document.getElementById("refreshWarning").style.display = "block"
    } else {
        if (refresh_resp !== undefined) {
            if (refresh_resp === refresh.dateString) {
                refresh.lastChange++;   // The date has not changed.
            } else {
                refresh.dateString = refresh_resp;
                refresh.lastChange = 0;

                document.getElementById("refreshTime").innerHTML = refresh_resp;
                document.getElementById("refreshWarning").style.display = "none"
            }
        }
    }
    setTimeout(update_refresh, 15000);
}

document.addEventListener('DOMContentLoaded', function () {
    update_page();
    update_refresh();
}, false);
