window.timetablesAPI_URL = 'https://stacjownik.spythere.eu/api/getActiveTrainList';
window.sceneryAPI_URL = 'https://stacjownik.spythere.eu/api/getSceneries';
window.nameCorrectionsAPI_URL = "https://raw.githubusercontent.com/Thundo54/tablice-td2-api/master/namesCorrections.json";
window.platformsAPI_URL = 'https://raw.githubusercontent.com/Ja-Tar/WTIP/main/platforms_info.json'

window.timetablesData = [];
window.platformsData = [];
window.checkpointData = [];
window.dataToDisplay = [];
window.nameCorrectionsData = {};
window.settings = {};
window.trainCategory = {
    "E": ['EI', 'EC', 'EN'],
    "O": ['MP', 'MH', 'MM', 'MO',
    'RP', 'RA', 'RM', 'RO'],
    "T":['PW', "PX",
    'TC', 'TG', 'TR', 'TD', 'TM', 'TN', 'TK', 'TS',
    'LP', 'LT', 'LS', 'LZ',
    'ZG', 'ZN', 'ZU']
};

window.refreshRoutine = null;
window.debug = false;
window.debugURL = ""; // example: http://127.0.0.1:5500
window.debugTermination = false;
window.platformsVersionID = "0.0.12"

// Button event listeners

document.getElementById("settings_button").addEventListener("click", function() {
    const modal = document.getElementById("settings_modal");
    const modalContent = document.querySelector(".modal_content");

    modal.classList.remove("fade-out");
    modalContent.classList.remove("slide-out");

    modal.style.display = "block";
    modal.classList.add("fade-in");
    modalContent.classList.add("slide-in");
});

document.getElementsByClassName("close_button")[0].addEventListener("click", function() {
    closeModal();
});

document.getElementById("save_settings").addEventListener("click", function() {
    showNotification("Ustawienia zapisane!");

    // Zastosuj ustawienia
    applySettings();

    // Zamknij modal
    closeModal();
});

document.getElementById("submit").addEventListener("click", function () {
    if (window.timetablesData) {
        processTimetablesData();
        setTimeout(() => {
            buttonSetDisplay();
            refreshDataRoutine();
        }, 500); // 1 second
    }
});

document.getElementById("language_switch").addEventListener("click", function () {
    if (document.documentElement.lang === "pl") {
        window.location.href = "index_en.html";
    } else if (document.documentElement.lang === "en") {
        window.location.href = "index.html";
    }
});

document.getElementById("dark_mode_button").addEventListener("click", () => {
    document.body.classList.toggle("dark_mode");
    window.localStorage.setItem("dark_mode", "true");
});

document.getElementById("light_mode_button").addEventListener("click", () => {
    document.body.classList.remove("dark_mode");
    window.localStorage.setItem("dark_mode", "false");
});

// Rest of the event listeners

window.addEventListener("click", function(event) {
    if (event.target == document.getElementById("settings_modal")) {
        closeModal();
    }
});

// Functions

// Settings functions

function closeModal() {
    const modal = document.getElementById("settings_modal");
    const modalContent = document.querySelector(".modal_content");

    modal.classList.remove("fade-in");
    modalContent.classList.remove("slide-in");

    modal.classList.add("fade-out");
    modalContent.classList.add("slide-out");

    setTimeout(() => {
        modal.style.display = "none";
    }, 300); // Czas trwania animacji
}

function applySettings(load = false) {
    let settings = window.localStorage.getItem("settings");
    let displayTrainsWithCargo = document.getElementById("display_train_with_cargo");
    let displayTrainWithoutTrackNr = document.getElementById("display_train_without_track_nr");

    const defaultSettings = {
        "displayTrainsWithCargo": false,
        "displayTrainWithoutTrackNr": true,
    };

    if (settings) {
        settings = JSON.parse(settings);
        settings = { ...defaultSettings, ...settings };
        window.settings = settings;
    } else {
        settings = defaultSettings;
    }

    if (load) {
        displayTrainsWithCargo.checked = settings.displayTrainsWithCargo;
        displayTrainWithoutTrackNr.checked = settings.displayTrainWithoutTrackNr;
    } else {
        settings.displayTrainsWithCargo = displayTrainsWithCargo.checked;
        settings.displayTrainWithoutTrackNr = displayTrainWithoutTrackNr.checked;
    }

    window.localStorage.setItem("settings", JSON.stringify(settings));
}

// Main functions

function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.add("show");
    notification.style.animation = "slideIn 0.3s forwards";

    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s forwards";
        setTimeout(() => {
            notification.classList.remove("show");
        }, 300); // Czas trwania animacji
    }, 3000); // Powiadomienie znika po 3 sekundach
}

function buttonSetDisplay() {
    let platformsLayout = document.getElementById("platforms_layout");

    showDisplays(platformsLayout.value);
}

function refreshDataRoutine() {
    if (window.refreshRoutine) {
        clearInterval(window.refreshRoutine);
    }

    window.refreshRoutine = setInterval(() => {
        getDataFromAPI();
    }, 60000); // 1 minute
}

function darkModeCheck() {
    if (window.localStorage.getItem("dark_mode") === "true") {
        document.body.classList.add("dark_mode");
    }
}

function loadFrames() {
    const track_display = document.getElementsByClassName('track_display');
    const oldFrames = document.querySelectorAll('.iframe_display');

    for (let i = 0; i < oldFrames.length; i++) {
        oldFrames[i].remove();
    }

    let domain = "https://ktip.pages.dev";
    let URL = "";

    if (window.debug === true && window.debugURL) {
        domain = window.debugURL;
    }

    let smallestDisplayId = Infinity;

    for (let i = 0; i < track_display.length; i++) {
        if (parseInt(track_display[i].id) < smallestDisplayId) {
            smallestDisplayId = parseInt(track_display[i].id);
        }
    }

    for (let i = 0; i < track_display.length; i++) {
        let { time, train_number, destination, firstStation, via_stations, operator, info_bar, delay, colorbar, colorfont, empty, terminatesHere } = getProcessedData(track_display[i].id, smallestDisplayId);
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

        if (terminatesHere === true || (window.debugTermination === true && window.debug === true && empty === "false")) {
            URL = `${domain}/template_WAW_ZACH_termination.html`
            params = `time_of_arrival=${time}&train_number=${train_number}&starting_station=${firstStation}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}`;
        } else {
            URL = `${domain}/template_WAW_ZACH.html`
            params = `time=${time}&train_number=${train_number}&destination=${destination}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}&empty=${empty}`;
        }

        const blobUrlParm = URL + "?" + params;

        const iframe = document.createElement('iframe');
        iframe.src = blobUrlParm;
        iframe.classList.add('iframe_display');
        track_display[i].appendChild(iframe);
    }
}

function getProcessedData(display_id, smallestDisplayId) {
    const checkpoint = document.getElementById("point").value;

    let dataToDisplay = window.dataToDisplay;

    let json = {};
    json.time = "None";
    json.train_number = "None";
    json.destination = "None";
    json.firstStation = "None";
    json.via_stations = "None";
    json.operator = "---";
    json.info_bar = "Uwaga, na stacji trwają testy systemu informacji pasażerskiej" //`Tor: ${display_id}`;
    json.delay = 0;
    json.colorbar = "#2f353d";
    json.colorfont = "#ffffff";
    json.empty = "true";
    json.terminatesHere = false;

    let closestArrivalTime = Infinity;

    for (i = 0; i < dataToDisplay.length; i++) {

        if (dataToDisplay[i].track === "0") {
            dataToDisplay[i].track = smallestDisplayId.toString();
        }

        if (dataToDisplay[i].track === display_id) {
            let trainNo = dataToDisplay[i].trainNo;
            let delay = dataToDisplay[i].delay;
            let viaStations = dataToDisplay[i].viaStations;
            let viaStationsMain = dataToDisplay[i].viaStationsMain;
            let arrivalTimestamp = dataToDisplay[i].arrivalTimestamp;
            //let departureTimestamp = dataToDisplay[i].departureTimestamp;
            let firstStation = dataToDisplay[i].firstStation;
            let lastStation = dataToDisplay[i].lastStation
            let timeTimestamp = new Date().getTime()

            if (arrivalTimestamp < closestArrivalTime && arrivalTimestamp > timeTimestamp) {
                closestArrivalTime = arrivalTimestamp;

                for (let j = 0; j < viaStations.length; j++) {
                    viaStations[j] = stationTextFixes(viaStations[j]);
                }

                for (let j = 0; j < viaStationsMain.length; j++) {
                    viaStationsMain[j] = stationTextFixes(viaStationsMain[j]);
                }

                viaStations.pop(); // remove last station from viaStations
                viaStationsMain.pop(); // remove last station from viaStationsMain

                viaStations.forEach((station, index) => {
                    if (station.toLowerCase() === checkpoint.toLowerCase()) {
                        viaStations.splice(0, index);

                        let firstMainStation = viaStationsMain.find(_station => viaStations.includes(_station));
                        let indexMain = viaStationsMain.indexOf(firstMainStation);
                        viaStationsMain.splice(0, indexMain);

                        if (viaStationsMain.includes(station)) {
                            let _index = viaStationsMain.indexOf(station);
                            viaStationsMain.splice(_index, 1);
                        }

                        if (viaStations.includes(station)) {
                            let _index = viaStations.indexOf(station);
                            viaStations.splice(_index, 1);
                        }
                    }
                });

                console.log("Closest arrival time: ", arrivalTimestamp, trainNo); // skipcq: JS-0002 Used for checking if everything is working correctly
                json.time = new Date(arrivalTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // "HH:MM"
                json.train_number = trainNo;
                json.destination = stationTextFixes(lastStation);
                json.firstStation = stationTextFixes(firstStation);
                json.via_stations = viaStationsMain.join(", ");
                
                if (delay < 0) {
                    json.delay = 0;
                } else {
                    json.delay = delay;
                }
                
                json.empty = "false";
                json.terminatesHere = dataToDisplay[i].terminatesHere;
            } else {
                console.log("Not closest arrival time: ", arrivalTimestamp, trainNo); // skipcq: JS-0002 Used for checking if everything is working correctly
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
                let category = timetable.category; // "EIE"
                let route = timetable.route.split("|");
                let firstStation = route[0];
                let lastStation = route[1];
                let viaStations = [];
                let viaStationsMain = [];
                let stopList = timetable.stopList;
                let shortCategory = category.slice(0, 2);

                if (window.settings.displayTrainsWithCargo === false && window.trainCategory["T"].includes(shortCategory)) {
                    continue;
                }

                for (let j = 0; j < stopList.length; j++) {
                    let comments = stopList[j].comments; // search for [peron],[tor] in comments

                    viaStations.push(stopList[j].stopNameRAW);
                    if (stopList[j].mainStop === true) {
                        viaStationsMain.push(stopList[j].stopNameRAW);
                    }

                    if (stopList[j].stopNameRAW.toLowerCase() === checkpoint.toLowerCase()) {
                        if (stopList[j].confirmed === 0) {
                            //if (stopList[j].stopped === 0) {
                            let platform = "0"
                            let track = "0"
                            if (comments) {
                                comments = comments.split(",");
                                platform = comments[0].slice(-1)[0];
                                track = Array.from(comments[1])[0];
                            } else if (!comments && window.settings.displayTrainWithoutTrackNr === false) {
                                continue;
                            }
                            let delay = stopList[j].departureDelay;
                            let arrivalTimestamp = stopList[j].arrivalRealTimestamp;
                            let departureTimestamp = stopList[j].departureTimestamp;

                            dataToDisplay.push({
                                "trainNo": trainNo,
                                "platform": platform,
                                "track": track,
                                "delay": delay,
                                "viaStations": viaStations,
                                "viaStationsMain": viaStationsMain,
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
    getTimetablesAPI().then(() => {
        processTimetablesData();
        setTimeout(() => {
            loadFrames();
        }, 1000); // 1 second
    });

    window.localStorage.setItem("version", window.platformsVersionID);
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
    let sceneryInput = document.getElementById("scenery");
    let sceneryList = document.getElementById("scenery_list");

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

    let pointsSelect = document.getElementById("point");

    if (sceneryInput.eventListeners && pointsSelect.eventListeners) {
        console.log("Event listeners already added"); // skipcq: JS-0002 Used for checking if everything is working correctly
    } else {

        sceneryInput.addEventListener("input", function () {
            let station = sceneryInput.value;
            updatePointsSelect(station);
        });

        pointsSelect.addEventListener("input", function () {
            updatePlatformsText()
        });
    }
}

function clearFields() {
    let sceneryInput = document.getElementById("scenery");
    let platformsLayout = document.getElementById("platforms_layout");

    sceneryInput.value = "";
    platformsLayout.value = "";
    sceneryInput.setAttribute('list', 'scenery_list');
}

function updatePointsSelect(station) {
    let pointsSelect = document.getElementById("point");

    pointsSelect.innerHTML = "";
    checkpointData = [];

    for (let i = 0; i < window.platformsData.length; i++) {
        if (window.platformsData[i].sceneryName === station) {
            for (let j = 0; j < window.platformsData[i].checkpoints.length; j++) {
                let option = document.createElement("option");
                option.value = window.platformsData[i].checkpoints[j].name + window.platformsData[i].checkpoints[j].suffix;
                option.innerHTML = window.platformsData[i].checkpoints[j].name + window.platformsData[i].checkpoints[j].suffix;
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
    const platformsLayout = document.getElementById("platforms_layout");
    const point = document.getElementById("point").value;
    //let pointData = checkpointData.platforms;

    platformsLayout.value = "";

    if (checkpointData.length === 0) {
        platformsLayout.disabled = true; //TODO: change to false when custom platform layout is added
        return;
    }

    platformsLayout.disabled = true;

    for (let y = 0; y < checkpointData.length; y++) {
        const dataPoint = checkpointData[y].name.toLowerCase() + checkpointData[y].suffix.toLowerCase();
        if (dataPoint !== point.toLowerCase()) {
            continue;
        }
        const _platforms = Object.keys(checkpointData[y].platforms);

        for (let i = 0; i < _platforms.length; i++) {
            const platformname = _platforms[i][0] + _platforms[i].split(" ")[1];
            const tracknr = checkpointData[y].platforms[_platforms[i]];
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
    const savedData = window.localStorage.getItem("platformsData");

    if ((savedData) && (saved)) {
        window.platformsData = JSON.parse(savedData);
    } else {
        await fetch(window.platformsAPI_URL, { cache: "no-store" })
            .then(response => response.json())
            .then(data => {
                window.platformsData = data;
                window.localStorage.setItem("platformsData", JSON.stringify(data));
            });
    }
}

async function getSceneryAPI(saved = false) {
    const savedData = window.localStorage.getItem("sceneryData");

    if ((savedData) && (saved)) {
        window.sceneryData = JSON.parse(savedData);
    } else {
        await fetch(window.sceneryAPI_URL, { cache: "no-store" })
            .then(response => response.json())
            .then(data => {
                window.sceneryData = data;
                window.localStorage.setItem("sceneryData", JSON.stringify(data));
            });
    }
}

async function getNameCorrectionsAPI() {
    const savedData = window.localStorage.getItem("nameCorrectionsData");

    if (savedData) {
        window.nameCorrectionsData = JSON.parse(savedData);
    } else {
        await fetch(window.nameCorrectionsAPI_URL, { cache: "no-store" })
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

    for (const key in window.nameCorrectionsData) {
        if (station.includes(key)) {
            station = station.replace(key, window.nameCorrectionsData[key]);
        }
    }

    return station;
}

function capitalize(str) {
    if (!str) return str;
    return str.toLowerCase().replace(/(^|\s)\S/g, function (letter) {
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
darkModeCheck();
applySettings(true);
clearFields();