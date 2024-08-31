window.timetablesAPI_URL = 'https://stacjownik.spythere.eu/api/getActiveTrainList';
window.sceneryAPI_URL = 'https://stacjownik.spythere.eu/api/getSceneries';
window.nameCorrectionsAPI_URL = "https://raw.githubusercontent.com/Thundo54/tablice-td2-api/master/namesCorrections.json";
window.platformsAPI_URL = 'https://raw.githubusercontent.com/Ja-Tar/WTIP/main/platforms_info.json'
window.timetablesData = [];
window.platformsData = [];
window.checkpointData = [];
window.dataToDisplay = [];
window.nameCorrectionsData = {};
window.platformsVersionID = "0.0.10"

document.getElementById("submit").addEventListener("click", function () {
    if (window.timetablesData) {
        buttonSetDisplay();
        processTimetablesData();
        setTimeout(() => {
            loadFrames();
        }, 1000);
    }
});

document.getElementById("language_switch").addEventListener("click", function () {
    if (document.documentElement.lang === "pl") {
        window.location.href = "index_en.html";
    } else if (document.documentElement.lang === "en") {
        window.location.href = "index.html";
    }
});

function buttonSetDisplay() {
    let platformsLayout = document.getElementById("platforms_layout");

    showDisplays(platformsLayout.value);
}

function loadFrames() {
    const track_display = document.getElementsByClassName('track_display');
    const oldFrames = document.querySelectorAll('.iframe_display');

    for (let i = 0; i < oldFrames.length; i++) {
        oldFrames[i].remove();
    }

    let URL = ""

    for (let i = 0; i < track_display.length; i++) {
        let { time, train_number, destination, firstStation, via_stations, operator, info_bar, delay, colorbar, colorfont, empty, terminatesHere } = getProcessedData(track_display[i].id);
        time = encodeURIComponent(time);
        train_number = encodeURIComponent(train_number);
        destination = encodeURIComponent(destination);
        firstStation = encodeURIComponent(firstStation);
        via_stations = encodeURIComponent(via_stations);
        operator = encodeURIComponent(operator);
        info_bar = encodeURIComponent(info_bar);
        delay = encodeURIComponent(delay);
        colorbar = encodeURIComponent(colorbar);
        colorfont = encodeURIComponent(colorfont);
        empty = encodeURIComponent(empty);

        let params = "";

        if (terminatesHere === true) {
            URL = "https://ktip.pages.dev/template_WAW_ZACH_termination.html"
            params = `time_of_arrival=${time}&train_number=${train_number}&starting_station=${firstStation}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}`;
        } else {
            URL = "https://ktip.pages.dev/template_WAW_ZACH.html"
            params = `time=${time}&train_number=${train_number}&destination=${destination}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}&empty=${empty}`;
        }
        
        const blobUrlParm = URL + "?" + params;

        const iframe = document.createElement('iframe');
        iframe.src = blobUrlParm;
        iframe.classList.add('iframe_display');
        track_display[i].appendChild(iframe);
    }
}

function getProcessedData(display_id) {
    let dataToDisplay = window.dataToDisplay;

    let json = {};
    json.time = "None";
    json.train_number = "None";
    json.destination = "None";
    json.firstStation = "None";
    json.via_stations = "None";
    json.operator = "---";
    json.info_bar = "UWAGA!: Trwają testy systemu"//`Tor: ${display_id}`;
    json.delay = 0;
    json.colorbar = "#2f353d";
    json.colorfont = "#ffffff";
    json.empty = "true";
    json.terminatesHere = false;

    let closestTrain = null;
    let closestArrivalTime = Infinity;

    for (i = 0; i < dataToDisplay.length; i++) {
        if (dataToDisplay[i].track === display_id) {
            let trainNo = dataToDisplay[i].trainNo;
            let delay = dataToDisplay[i].delay;
            let viaStations = dataToDisplay[i].viaStations;
            let arrivalTimestamp = dataToDisplay[i].arrivalTimestamp;
            let departureTimestamp = dataToDisplay[i].departureTimestamp;
            let firstStation = dataToDisplay[i].firstStation;
            let lastStation = dataToDisplay[i].lastStation
            let timeTimestamp = new Date().getTime()

            if (arrivalTimestamp < closestArrivalTime && arrivalTimestamp > timeTimestamp) {
                closestArrivalTime = arrivalTimestamp;

                for (let j = 0; j < viaStations.length; j++) {
                    viaStations[j] = stationTextFixes(viaStations[j]);
                }

                console.log("Closest arrival time: ", arrivalTimestamp, trainNo);
                json.time = new Date(arrivalTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // "HH:MM"
                json.train_number = trainNo;
                json.destination = stationTextFixes(lastStation);
                json.firstStation = firstStation;
                json.via_stations = viaStations.join(", ");
                json.delay = delay;
                json.empty = "false";
                json.terminatesHere = dataToDisplay[i].terminatesHere;
            } else {
                console.log("Not closest arrival time: ", arrivalTimestamp, trainNo);
            }
        }
    }

    return json;
}

function processTimetablesData() {
    let server = document.getElementById("server").value;
    let checkpoint = document.getElementById("point").value;

    let timetableData = window.timetablesData;
    let dataToDisplay = []

    for (let i = 0; i < timetableData.length; i++) {
        if (timetableData[i].region === server) {
            let timetable = timetableData[i].timetable;
            let trainNo = timetableData[i].trainNo;

            if (timetable) {
                let route = timetable.route.split("|");
                let firstStation = route[0];
                let lastStation = route[1];
                let viaStations = [];
                let stopList = timetable.stopList;
                let comments = timetable.comments; // search for [peron],[tor] in comments
                if (!comments) {
                    comments = "1,1";
                }

                for (let j = 0; j < stopList.length; j++) {
                    if (stopList[j].mainStop === true) {
                        viaStations.push(stopList[j].stopNameRAW);
                    }
                    if (stopList[j].stopNameRAW === checkpoint) {
                        if (stopList[j].confirmed === 0) {
                            //if (stopList[j].stopped === 0) {
                            comments = comments.split(",");
                            let platform = comments[0].slice(-1)[0];
                            let track = Array.from(comments[1])[0];
                            let delay = stopList[j].departureDelay;
                            let arrivalTimestamp = stopList[j].arrivalRealTimestamp;
                            let departureTimestamp = stopList[j].departureTimestamp;

                            dataToDisplay.push({
                                "trainNo": trainNo,
                                "platform": platform,
                                "track": track,
                                "delay": delay,
                                "viaStations": viaStations,
                                "arrivalTimestamp": arrivalTimestamp,
                                "departureTimestamp": departureTimestamp,
                                "stopped": stopList[j].stopped,
                                "firstStation": firstStation,
                                "lastStation": lastStation,
                                "terminatesHere": stopList[j].terminatesHere
                            });
                            //} else {
                            //    console.log(stopList[j], trainNo, "Stopped");
                            //}
                        }
                    }
                }
            }
        }
    }

    window.dataToDisplay = dataToDisplay;
}

function getDataFromAPI() {
    let saved = false;
    let sceneryInput = document.getElementById("scenery");
    let platformsLayout = document.getElementById("platforms_layout");

    sceneryInput.value = "";
    platformsLayout.value = "";

    sceneryInput.setAttribute('list', 'scenery_list');

    if (window.localStorage.getItem("version") === window.platformsVersionID) {
        saved = true;
    }

    getSceneryAPI(saved).then(() => {
        getPlatformsAPI(saved).then(() => {
            getNameCorrectionsAPI().then(() => {
                updateTextScenery();
            });
        });
    });
    getTimetablesAPI()

    window.localStorage.setItem("version", window.platformsVersionID);

    setTimeout(() => {
        getTimetablesAPI().then(() => {
            getNameCorrectionsAPI().then(() => {
                processTimetablesData()
                loadFrames();
            });
        });
    }, 60000); // 1 minute
}

function showDisplays(platformsConfig) { // example showDisplays("P1-1,3; P2-2,4; ")
    let platformRow = document.getElementById("platform_row");

    platformRow.innerHTML = "";

    platformsConfig = platformsConfig.split(";");
    platformsConfig = platformsConfig.slice(0, -1);

    for (let i = 0; i < platformsConfig.length; i++) {
        let platformNumber = platformsConfig[i].split("-")[0].split("P")[1];
        let trackNumbers = platformsConfig[i].split("-")[1].split(",");

        let platformDiv = document.createElement("div");
        platformDiv.className = "platform";
        platformDiv.id = "platform_" + platformNumber;
        platformRow.appendChild(platformDiv);

        let platformName = document.createElement("div");
        platformName.className = "platform_name";
        if (document.documentElement.lang === "pl") {
            platformName.innerHTML = "Peron " + platformNumber;
        } else if (document.documentElement.lang === "en") {
            platformName.innerHTML = "Platform " + platformNumber;
        }
        platformDiv.appendChild(platformName);

        let platformTracks = document.createElement("div");
        platformTracks.className = "platform_tracks";
        platformDiv.appendChild(platformTracks);

        for (let j = 0; j < trackNumbers.length; j++) {
            let trackDisplay = document.createElement("div");
            trackDisplay.className = "track_display";
            trackDisplay.id = trackNumbers[j];
            platformTracks.appendChild(trackDisplay);

            let trackName = document.createElement("div");
            trackName.className = "track_name";
            if (document.documentElement.lang === "pl") {
                trackName.innerHTML = "Tor " + trackNumbers[j];
            } else if (document.documentElement.lang === "en") {
                trackName.innerHTML = "Track " + trackNumbers[j];
            }
            trackDisplay.appendChild(trackName);
        }
    }

    loadFrames();
}

// All functions for updating text fields and select options

function updateTextScenery() {
    var sceneryInput = document.getElementById("scenery");
    var sceneryList = document.getElementById("scenery_list");

    if (!sceneryList) {
        sceneryList = document.createElement("datalist");
        sceneryList.id = "scenery_list";
        sceneryInput.appendChild(sceneryList);
    }

    sceneryList.innerHTML = "";

    for (let i = 0; i < window.sceneryData.length; i++) {
        let option = document.createElement("option");
        option.value = window.sceneryData[i].name;
        sceneryList.appendChild(option);
    }

    sceneryInput.addEventListener("input", function () {
        let station = sceneryInput.value;
        updatePointsSelect(station);
    });

    let pointsSelect = document.getElementById("point");

    pointsSelect.addEventListener("input", function () {
        updatePlatformsText()
    });
}

function updatePointsSelect(station) {
    let pointsSelect = document.getElementById("point");

    pointsSelect.innerHTML = "";
    checkpointData = [];

    for (let i = 0; i < window.platformsData.length; i++) {
        if (window.platformsData[i].station === station) {
            for (let j = 0; j < window.platformsData[i].checkpoints.length; j++) {
                let option = document.createElement("option");
                option.value = window.platformsData[i].checkpoints[j].pname;
                option.innerHTML = window.platformsData[i].checkpoints[j].pname;
                pointsSelect.appendChild(option);
                checkpointData.push(window.platformsData[i].checkpoints[j]);
            }
        }
    }

    updatePlatformsText();

    if (pointsSelect.length === 0) {
        let option = document.createElement("option");
        option.value = "none";
        if (document.documentElement.lang === "pl") {
            option.innerHTML = "Nie wybrano";
        } else if (document.documentElement.lang === "en") {
            option.innerHTML = "None";
        }
        pointsSelect.appendChild(option);
    }
}

function updatePlatformsText() {
    let platformsLayout = document.getElementById("platforms_layout");
    let point = document.getElementById("point").value;
    let pointData = checkpointData.platforms;

    platformsLayout.value = "";

    if (checkpointData.length === 0) {
        platformsLayout.disabled = false;
        return;
    }

    platformsLayout.disabled = true;

    for (let y = 0; y < checkpointData.length; y++) {
        if (checkpointData[y].pname !== point) {
            continue;
        }

        let _platforms = Object.keys(checkpointData[y].platforms);

        for (let i = 0; i < _platforms.length; i++) {
            let platformname = _platforms[i][0] + _platforms[i].split(" ")[1];
            let tracknr = checkpointData[y].platforms[_platforms[i]];
            platformsLayout.value += platformname + "-" + tracknr + "; ";
        }
    }

}

// All API functions

async function getTimetablesAPI() {
    await fetch(window.timetablesAPI_URL)
        .then(response => response.json())
        .then(data => {
            window.timetablesData = data;
        });
}

async function getPlatformsAPI(saved = false) {
    let savedData = window.localStorage.getItem("platformsData");

    if ((savedData) && (saved)) {
        window.platformsData = JSON.parse(savedData);
    } else {
        await fetch(window.platformsAPI_URL)
            .then(response => response.json())
            .then(data => {
                window.platformsData = data;
                window.localStorage.setItem("platformsData", JSON.stringify(data));
            });
    }
}

async function getSceneryAPI(saved = false) {
    let savedData = window.localStorage.getItem("sceneryData");

    if ((savedData) && (saved)) {
        window.sceneryData = JSON.parse(savedData);
    } else {
        await fetch(window.sceneryAPI_URL)
            .then(response => response.json())
            .then(data => {
                window.sceneryData = data;
                window.localStorage.setItem("sceneryData", JSON.stringify(data));
            });
    }
}

async function getNameCorrectionsAPI() {
    let savedData = window.localStorage.getItem("nameCorrectionsData");

    if (savedData) {
        window.nameCorrectionsData = JSON.parse(savedData);
    } else {
        await fetch(window.nameCorrectionsAPI_URL)
            .then(response => response.json())
            .then(data => {
                window.nameCorrectionsData = data;
                window.localStorage.setItem("nameCorrectionsData", JSON.stringify(data));
            });
    }
}

function stationTextFixes(station) {
    station = capitalize(station);

    // nameCorrectionsData example
    // {"Dobrz.": "Dobrzyniec"}

    // station str
    // "Dobrz. mącice"

    for (let key in window.nameCorrectionsData) {
        if (station.includes(key)) {
            station = station.replace(key, window.nameCorrectionsData[key]);
        }
    }

    return station;
}   

function capitalize(str) {
    if (!str) return str;
    return str.toLowerCase().replace(/(^|\s)\S/g, function(letter) {
        return letter.toUpperCase();
    });
}

/* Testing
function updateDisplay() {

}

setTimeout(() => {
    updateDisplay();
    setInterval(updateDisplay, 240000);
}, 240000);

*/

getDataFromAPI();