window.timetablesAPI_URL = 'https://stacjownik.spythere.eu/api/getActiveTrainList';
window.sceneryAPI_URL = 'https://api.td2.info.pl/?method=getStationsOnline';
window.nameCorrectionsAPI_URL = "https://raw.githubusercontent.com/Thundo54/tablice-td2-api/master/namesCorrections.json";
window.operatorConvertAPI_URL = 'https://raw.githubusercontent.com/Thundo54/tablice-td2-api/master/operatorConvert.json';
window.platformsAPI_URL = 'https://raw.githubusercontent.com/Ja-Tar/WTIP/main/platforms_info.json';

window.timetablesData = [];
window.platformsData = [];
window.checkpointData = [];
window.dataToDisplay = [];
window.operatorConvertData = {};
window.nameCorrectionsData = {};
window.settings = {};

window.trainCategory = {
    "E": ['EI', 'EC', 'EN'],
    "O": ['MP', 'MH', 'MM', 'MO',
        'RP', 'RA', 'RM', 'RO'],
    "T": ['PW', "PX",
        'TC', 'TG', 'TR', 'TD', 'TM', 'TN', 'TK', 'TS', 'TH',
        'LP', 'LT', 'LS', 'LZ',
        'ZG', 'ZN', 'ZU']
};
window.operatorFullNames = {
    "IC": "PKP Intercity",
    "KM": "Koleje Mazowieckie",
    "SKMT": "SKM Trójmiasto",
    "PR": "POLREGIO",
    "KŚ": "Koleje Śląskie",
    "ŁKA": "Łódzka Kolej Aglomeracyjna",
    "KD": "Koleje Dolnośląskie",
    "": " "
}

window.refreshRoutine = null;
window.debug = false;
window.iframeDebugURL = ""; // example: http://127.0.0.1:5500
window.platformsAPIDebugBranch = "main"; // example: main
window.debugTermination = false;
window.platformsVersionID = "0.0.15"

if (window.debug === true) {
    console.warn("Debug mode enabled! Change debug to false in index.js before deployment!");
    console.warn(`Iframe debug URL: ${window.iframeDebugURL}, 
Platforms API debug branch: ${window.platformsAPIDebugBranch}, 
Debug termination: ${window.debugTermination}`);
    window.platformsAPI_URL = `https://raw.githubusercontent.com/Ja-Tar/WTIP/${window.platformsAPIDebugBranch}/platforms_info.json`;
    localStorage.removeItem("version");
}

// Button event listeners

document.getElementById("settings_button").addEventListener("click", function () {
    const modal = document.getElementById("settings_modal");
    const modalContent = document.querySelector(".modal_content");

    modal.classList.remove("fade-out");
    modalContent.classList.remove("slide-out");

    modal.style.display = "block";
    modal.classList.add("fade-in");
    modalContent.classList.add("slide-in");
});

document.getElementsByClassName("close_button")[0].addEventListener("click", function () {
    closeModal();
});

document.getElementById("save_settings").addEventListener("click", function () {
    showNotification("Ustawienia zapisane!");

    // Zastosuj ustawienia
    applySettings();

    // Zamknij modal
    closeModal();
});

document.getElementById("reset_settings").addEventListener("click", function () {
    showNotification("Ustawienia zresetowane!");

    localStorage.clear();

    closeModal();

    setTimeout(() => {
        window.location.reload();
    }, 500); // 1 second
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
    localStorage.setItem("dark_mode", "true");
});

document.getElementById("light_mode_button").addEventListener("click", () => {
    document.body.classList.remove("dark_mode");
    localStorage.setItem("dark_mode", "false");
});

// Rest of the event listeners

window.addEventListener("click", function (event) {
    if (event.target === document.getElementById("settings_modal")) {
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
    let settings = localStorage.getItem("settings");
    let displayTrainsWithCargo = document.getElementById("display_train_with_cargo");
    let displayTrainWithoutTrackNr = document.getElementById("display_train_without_track_nr");
    let displayTrainThatDoesNotStop = document.getElementById("display_train_without_stop");

    const defaultSettings = {
        "displayTrainsWithCargo": false,
        "displayTrainWithoutTrackNr": true,
        "displayTrainThatDoesNotStop": true
    };

    if (settings) {
        settings = JSON.parse(settings);
        settings = { ...defaultSettings, ...settings };
        window.settings = settings;
    } else {
        settings = defaultSettings;
        window.settings = settings;
    }

    if (load) {
        displayTrainsWithCargo.checked = settings.displayTrainsWithCargo;
        displayTrainWithoutTrackNr.checked = settings.displayTrainWithoutTrackNr;
        displayTrainThatDoesNotStop.checked = settings.displayTrainThatDoesNotStop;
    } else {
        settings.displayTrainsWithCargo = displayTrainsWithCargo.checked;
        settings.displayTrainWithoutTrackNr = displayTrainWithoutTrackNr.checked;
        settings.displayTrainThatDoesNotStop = displayTrainThatDoesNotStop.checked;
    }

    localStorage.setItem("settings", JSON.stringify(settings));
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
    if (localStorage.getItem("dark_mode") === "true") {
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

    if (window.debug === true && window.iframeDebugURL) {
        domain = window.iframeDebugURL;
    }

    let smallestDisplayId = Infinity;

    for (let i = 0; i < track_display.length; i++) {
        if (parseInt(track_display[i].id) < smallestDisplayId) {
            smallestDisplayId = parseInt(track_display[i].id);
        }
    }

    for (let i = 0; i < track_display.length; i++) {
        let { time, train_number, destination, firstStation, via_stations, operator, info_bar, train_name, delay, colorbar, colorfont, empty, terminatesHere } = getProcessedData(track_display[i].id, smallestDisplayId);
        time = encodeURIComponent(time);
        train_number = encodeURIComponent(train_number);
        destination = encodeURIComponent(destination);
        firstStation = encodeURIComponent(firstStation);
        via_stations = encodeURIComponent(via_stations);
        operator = encodeURIComponent(window.operatorFullNames[operator]);
        train_name = encodeURIComponent(train_name);
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
            params = `time=${time}&train_number=${train_number}&destination=${destination}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&train_name=${train_name}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}&empty=${empty}`;
        }

        const blobUrlParm = URL + "?" + params;

        const iframe = document.createElement('iframe');
        iframe.src = blobUrlParm;
        iframe.classList.add('iframe_display');
        track_display[i].appendChild(iframe);
    }
}

function getProcessedData(display_id, smallestDisplayId) {
    let checkpoint = document.getElementById("point").value;

    let dataToDisplay = window.dataToDisplay;

    let processedData = {};
    processedData.time = "None";
    processedData.train_number = "None";
    processedData.destination = "None";
    processedData.firstStation = "None";
    processedData.via_stations = "None";
    processedData.operator = "";
    processedData.train_name = "";
    processedData.info_bar = "Uwaga, na stacji trwają testy systemu informacji pasażerskiej" //`Tor: ${display_id}`;
    processedData.delay = 0;
    processedData.colorbar = "#2f353d";
    processedData.colorfont = "#ffffff";
    processedData.empty = "true";
    processedData.terminatesHere = false;

    let closestArrivalTime = Infinity;
    let trainNumberPrefix = "";
    let catIndex = -1; // Closest arrival time index

    for (i = 0; i < dataToDisplay.length; i++) {
        let arrivalRealTimestamp = dataToDisplay[i].arrivalRealTimestamp;
        let trainNo = dataToDisplay[i].trainNo;

        // Train time recognition

        if (arrivalRealTimestamp > closestArrivalTime) {
            console.debug("Not closest arrival time: ", arrivalRealTimestamp, trainNo);
            continue;
        } else {
            if (checkpoint.includes(", po") && arrivalRealTimestamp < Date.now()) {
                console.debug("Train has already arrived: ", arrivalRealTimestamp, trainNo);
                continue;
            }
            console.debug("Closest arrival time: ", arrivalRealTimestamp, trainNo);
            catIndex = i;
            closestArrivalTime = arrivalRealTimestamp;
        }
    }

    if (catIndex === -1) {
        console.debug("No closest arrival time found");
        return processedData;
    }

    if (dataToDisplay[catIndex].track === "0") {
        dataToDisplay[catIndex].track = smallestDisplayId.toString();
    }

    if (dataToDisplay[catIndex].track === display_id) {
        let trainNo = dataToDisplay[catIndex].trainNo;
        let trainCategory = dataToDisplay[catIndex].category;
        let stockString = dataToDisplay[catIndex].stockString;
        let arrivalDelay = dataToDisplay[catIndex].arrivalDelay;
        let departureDelay = dataToDisplay[catIndex].departureDelay;
        let viaStations = dataToDisplay[catIndex].viaStations;
        let viaStationsMain = dataToDisplay[catIndex].viaStationsMain;
        let arrivalTimestamp = dataToDisplay[catIndex].arrivalTimestamp;
        let departureTimestamp = dataToDisplay[catIndex].departureTimestamp;
        let firstStation = dataToDisplay[catIndex].firstStation;
        let lastStation = dataToDisplay[catIndex].lastStation;
        let terminatesHere = dataToDisplay[catIndex].terminatesHere;

        // Operator recognition

        let operatorList = [];

        for (const key in window.operatorConvertData.operators) {
            const splitStockString = stockString.split(";");

            for (let j = 0; j < splitStockString.length; j++) {
                if (key === splitStockString[j]) {
                    operatorList.push(window.operatorConvertData.operators[key]);
                }
            }
        }

        // Get most common operator 
        if (operatorList.length > 0) {
            let counts = {};
            operatorList.forEach(function (operators) {
                operators.forEach(function (operator) {
                    counts[operator] = (counts[operator] || 0) + 1;
                });
            });

            const mostCommonOperator = Object.keys(counts).reduce(function (a, b) {
                return counts[a] > counts[b] ? a : b;
            });

            processedData.operator = mostCommonOperator;
            console.debug("Most common operator: ", mostCommonOperator);
        }

        // Train prefix recognition

        debugger;

        for (let j = 0; j < window.operatorConvertData.categories.length; j++) {
            let prefixData = window.operatorConvertData.categories[j];
            let trainOperator = processedData.operator;
            let prefixObject = prefixData.category;

            if (prefixData.operator === trainOperator) {
                for (let key in prefixObject) {
                    if (trainCategory.startsWith(key)) {
                        trainNumberPrefix = prefixObject[key];
                        console.debug(`Train with prefix: ${trainNumberPrefix} ${trainNo}`);
                    }
                }
            }
        }

        debugger;

        // Train name recognition

        for (let j = 0; j < window.operatorConvertData.trainNames.length; j++) {
            let trainNameData = window.operatorConvertData.trainNames[j];
            let trainOperatorBefore = processedData.operator;
            let trainNoIs = trainNameData.trainNo;

            for (let k = 0; k < trainNoIs.length; k++) {
                if (trainNameData.operator === trainOperatorBefore) {
                    if (trainNoIs[k] === trainNo.toString()) {
                        const operator = trainNameData.operator;
                        const train_name = trainNameData.trainName;
                        trainNumberPrefix = trainNameData.categoryOverwrite;

                        processedData.train_name = train_name;
                        processedData.operator = operator;
                        console.debug(`Name: ${train_name}, Operator: ${operator}, Number: ${trainNumberPrefix} ${trainNo}`);
                        break;
                    }
                } else {
                    break;
                }
            }

        }

        debugger;

        // Train name and prefix override

        // TODO: Add train name and prefix override

        // viaStations recognition

        for (let j = 0; j < viaStations.length; j++) {
            viaStations[j] = stationTextFixes(viaStations[j]);
        }

        for (let j = 0; j < viaStationsMain.length; j++) {
            viaStationsMain[j] = stationTextFixes(viaStationsMain[j]);
        }

        // Usunięcie wszystkich stacji przed oraz aktualną stację (checkpoint) w viaStations
        const checkpointIndex = viaStations.findIndex(station => station.toLowerCase() === checkpoint.toLowerCase());
        if (checkpointIndex !== -1) {
            viaStations.splice(0, checkpointIndex + 1);
        }

        // Znalezienie pierwszej wspólnej stacji w viaStations i viaStationsMain
        let firstCommonStation = null;
        for (let station of viaStationsMain) {
            if (viaStations.includes(station)) {
                firstCommonStation = station;
                break;
            }
        }

        // Usunięcie wszystkich stacji w viaStationsMain do momentu znalezienia pierwszej wspólnej stacji
        if (firstCommonStation) {
            const firstCommonIndex = viaStationsMain.indexOf(firstCommonStation);
            viaStationsMain.splice(0, firstCommonIndex);
        } else {
            viaStationsMain = [];
        }

        for (let j = 0; j < viaStationsMain.length; j++) {
            viaStationsMain[j] = viaStationsMain[j].split(",")[0];
        }

        let timeTimestamp = 0;

        if (terminatesHere === true) {
            timeTimestamp = arrivalTimestamp;
        } else {
            timeTimestamp = departureTimestamp;
        }

        processedData.time = new Date(timeTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // "HH:MM"
        processedData.train_number = `${trainNumberPrefix} ${trainNo}`;
        processedData.destination = stationTextFixes(lastStation);
        processedData.firstStation = stationTextFixes(firstStation);
        processedData.via_stations = viaStationsMain.join(", ");

        if (departureDelay < 0) {
            processedData.delay = 0;
        } else {
            processedData.delay = departureDelay;
            console.debug("Departure delay: ", departureDelay);
        }

        if (arrivalDelay < 0 && terminatesHere === true) {
            processedData.delay = 0;
        } else {
            processedData.delay = arrivalDelay;
            console.debug("Arrival delay: ", arrivalDelay);
        }

        processedData.empty = "false";
        processedData.terminatesHere = terminatesHere;

    }

    return processedData;
}

function processTimetablesData() {
    console.debug("==== Processing timetables data ====");

    let server = document.getElementById("server").value;
    let checkpoint = document.getElementById("point").value;

    let timetableData = window.timetablesData;
    let dataToDisplay = []

    for (let i = 0; i < timetableData.length; i++) {
        if (timetableData[i].region === server) {
            let timetable = timetableData[i].timetable;
            let trainNo = timetableData[i].trainNo;
            const stockString = timetableData[i].stockString;

            if (timetable) {
                let category = timetable.category; // "EIE"
                let route = timetable.route.split("|");
                let firstStation = route[0];
                let lastStation = route[1];
                let viaStations = [];
                let viaStationsMain = [];
                let stopList = timetable.stopList;
                let shortCategory = category.slice(0, 2);

                if (window.settings.displayTrainsWithCargo === false && window.trainCategory.T.includes(shortCategory)) {
                    continue;
                }

                for (let j = 0; j < stopList.length; j++) {
                    let comments = stopList[j].comments; // search for [peron],[tor] in comments

                    viaStations.push(stopList[j].stopNameRAW);
                    if (stopList[j].stopType.includes("ph") && stopList[j].confirmed === 0) {
                        viaStationsMain.push(stopList[j].stopNameRAW);
                    }

                    if (stopList[j].stopNameRAW.toLowerCase() === checkpoint.toLowerCase()) {
                        if (stopList[j].confirmed === 0) {
                            if (window.settings.displayTrainThatDoesNotStop === false) {
                                if (!stopList[j].stopType.includes("ph") && stopList[j].terminatesHere === false && stopList[j].beginsHere === false) {
                                    continue;
                                }
                            }

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

                            let arrivalDelay = stopList[j].arrivalDelay;
                            let departureDelay = stopList[j].departureDelay;
                            let arrivalTimestamp = stopList[j].arrivalTimestamp;
                            let arrivalRealTimestamp = stopList[j].arrivalRealTimestamp;
                            let departureTimestamp = stopList[j].departureTimestamp;

                            dataToDisplay.push({
                                "trainNo": trainNo,
                                "category": category,
                                "stockString": stockString,
                                "platform": platform,
                                "track": track,
                                "arrivalDelay": arrivalDelay,
                                "departureDelay": departureDelay,
                                "viaStations": viaStations,
                                "viaStationsMain": viaStationsMain,
                                "arrivalTimestamp": arrivalTimestamp,
                                "arrivalRealTimestamp": arrivalRealTimestamp,
                                "departureTimestamp": departureTimestamp,
                                //"stopped": stopList[j].stopped, // NOT USED
                                //"confirmed": stopList[j].confirmed, // NOT USED
                                "firstStation": firstStation,
                                "lastStation": lastStation,
                                "terminatesHere": stopList[j].terminatesHere
                            });
                            //} else {
                            //    console.debug(stopList[j], trainNo, "Stopped");
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

    if (localStorage.getItem("version") === window.platformsVersionID) {
        saved = true;
    }

    getSceneryAPI().then(() => {
        getPlatformsAPI(saved).then(() => {
            getNameCorrectionsAPI().then(() => {
                updateTextScenery();
            });
        });
    });
    getTimetablesAPI().then(() => {
        getOperatorConvertAPI().then(() => {
            processTimetablesData();
            setTimeout(() => {
                loadFrames();
            }, 1000); // 1 second
        });
    });

    localStorage.setItem("version", window.platformsVersionID);
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
        option.value = window.sceneryData[i].stationName;
        sceneryList.appendChild(option);
    }

    let pointsSelect = document.getElementById("point");

    if (sceneryInput.eventListeners && pointsSelect.eventListeners) {
        console.debug("Event listeners already added");
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
    let scenerySupport = document.getElementById("supported_icon").children[0];

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

    if (checkpointData.length === 0) {
        scenerySupport.setAttribute("src", "emoji/274C.svg");
        scenerySupport.setAttribute("alt", "❌");
    } else {
        scenerySupport.setAttribute("src", "emoji/2714.svg");
        scenerySupport.setAttribute("alt", "✔️");
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
    const savedData = localStorage.getItem("platformsData");

    if ((savedData) && (saved)) {
        window.platformsData = JSON.parse(savedData);
    } else {
        await fetch(window.platformsAPI_URL, { cache: "no-store" })
            .then(response => response.json())
            .then(data => {
                window.platformsData = data;
                localStorage.setItem("platformsData", JSON.stringify(data));
            });
    }
}

async function getSceneryAPI() {
    const savedData = localStorage.getItem("sceneryData");
    const lastSaved = localStorage.getItem("lastSaved");

    // 5 min
    if (parseInt(lastSaved) + 300000 > Date.now()) {
        saved = true;
        console.debug("Scenery data from cache");
    } else {
        saved = false;
        localStorage.setItem("lastSaved", Date.now().toString());
    }

    if ((savedData) && (saved)) {
        window.sceneryData = JSON.parse(savedData);
    } else {
        await fetch(window.sceneryAPI_URL, { cache: "no-store" })
            .then(response => response.json())
            .then(data => {
                window.sceneryData = data.message;
                localStorage.setItem("sceneryData", JSON.stringify(data.message));
            });
    }
}

async function getNameCorrectionsAPI() {
    const savedData = localStorage.getItem("nameCorrectionsData");

    if (savedData) {
        window.nameCorrectionsData = JSON.parse(savedData);
    } else {
        await fetch(window.nameCorrectionsAPI_URL, { cache: "no-store" })
            .then(response => response.json())
            .then(data => {
                window.nameCorrectionsData = data;
                localStorage.setItem("nameCorrectionsData", JSON.stringify(data));
            });
    }
}

async function getOperatorConvertAPI() {
    const savedData = localStorage.getItem("operatorConvertData");

    if (savedData) {
        window.operatorConvertData = JSON.parse(savedData);
    } else {
        await fetch(window.operatorConvertAPI_URL, { cache: "no-store" })
            .then(response => response.json())
            .then(data => {
                window.operatorConvertData = data;
                localStorage.setItem("operatorConvertData", JSON.stringify(data));
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
