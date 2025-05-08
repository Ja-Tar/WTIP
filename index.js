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
    "PKP": "PKP",
}

window.refreshRoutine = null;
window.currentPlatformsLayout = "";
window.debug = false;
window.iframeDebugURL = ""; // example: http://127.0.0.1:5500
window.platformsAPIDebugBranch = "main"; // example: main
window.debugTermination = false;
window.platformsVersionID = "0.0.17";

if (window.debug === true) {
    console.warn("Debug mode enabled! Change debug to false in index.js before deployment!");
    console.warn(`Iframe debug URL: ${window.iframeDebugURL}, 
Platforms API debug branch: ${window.platformsAPIDebugBranch}, 
Debug termination: ${window.debugTermination}`);
    window.platformsAPI_URL = `https://raw.githubusercontent.com/Ja-Tar/WTIP/${window.platformsAPIDebugBranch}/platforms_info.json`;
    localStorage.removeItem("version");
}

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


/**
 * Zastosowuje lub pobiera wartości lub stany zaznaczenia między obiektem ustawień a elementami DOM.
 *
 * @param {Object} mapping - Obiekt mapujący klucze w obiekcie ustawień na identyfikatory elementów DOM.
 * @param {Object} settings - Obiekt zawierający ustawienia do zastosowania lub zaktualizowania.
 * @param {boolean} load - Jeśli `true`, ładuje wartości z obiektu ustawień do elementów DOM.
 *                         Jeśli `false`, aktualizuje obiekt ustawień wartościami z elementów DOM.
 * @param {boolean} [useChecked=false] - Jeśli `true`, operuje na właściwości `checked` elementów (np. checkboxy).
 *                                       Jeśli `false`, operuje na właściwości `value` elementów.
 */
function applySettingValueOrChecked(mapping, settings, load, useChecked = false) {
    Object.keys(mapping).forEach(key => {
        const element = document.getElementById(mapping[key]);
        if (load) {
            if (useChecked) {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        } else {
            if (useChecked) {
                settings[key] = element.checked;
            } else {
                settings[key] = element.value;
            }
        }
    });
}

/**
 * Zastosowuje ustawienia użytkownika, ładując je z localStorage lub używając wartości domyślnych.
 * Aktualizuje elementy interfejsu użytkownika na podstawie ustawień, gdy `load` jest ustawione na true,
 * lub aktualizuje ustawienia na podstawie elementów interfejsu użytkownika, gdy `load` jest ustawione na false.
 * Zapisuje zaktualizowane ustawienia z powrotem do localStorage.
 *
 * @param {boolean} [load=false] - Określa kierunek operacji:
 *                                 `true` aby załadować ustawienia do interfejsu użytkownika,
 *                                 `false` aby zapisać ustawienia z interfejsu użytkownika.
 * @param {Object|null} [custom=null] - Opcjonalne konkretne ustawienia do zastosowania.
 * @param {boolean} [customChecked=false] - Określa, czy używać właściwości `checked` dla elementów (np. checkboxy).
 */
function applySettings(load = false, custom = null, customChecked = false) {
    let settings = localStorage.getItem("settings");

    const defaultSettings = {
        "displayTrainsWithCargo": false,
        "displayTrainWithoutTrackNr": true,
        "displayTrainThatDoesNotStop": true,
        "roundingDelay": true,
        "displayScreenSize": "100",
    };

    if (settings) {
        settings = JSON.parse(settings);
        settings = { ...defaultSettings, ...settings };
        window.settings = settings;
    } else {
        settings = defaultSettings;
        window.settings = settings;
    }

    if (!custom) {
        const boolSettingsMapping = {
            displayTrainsWithCargo: "display_train_with_cargo",
            displayTrainWithoutTrackNr: "display_train_without_track_nr",
            displayTrainThatDoesNotStop: "display_train_without_stop",
            roundingDelay: "rounding_delay",
        };

        applySettingValueOrChecked(boolSettingsMapping, settings, load, true);

        const valueSettingsMapping = {
            displayScreenSize: "display_screen_size",
        }

        applySettingValueOrChecked(valueSettingsMapping, settings, load);
    } else {
        applySettingValueOrChecked(custom, settings, load, customChecked);
    }

    localStorage.setItem("settings", JSON.stringify(settings));
    changeScreenSize();
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
        let _operator = window.operatorFullNames[operator]
        time = encodeURIComponent(time);
        train_number = encodeURIComponent(train_number);
        destination = encodeURIComponent(destination);
        firstStation = encodeURIComponent(firstStation);
        via_stations = encodeURIComponent(via_stations);
        operator = encodeURIComponent(_operator === undefined ? " " : _operator);
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

        // Remove old iframe if change needed
        const oldIframe = document.getElementById(`iframe_${track_display[i].id}`);
        if (oldIframe) {
            if (oldIframe.src === blobUrlParm) {
                continue;
            }
            oldIframe.remove();
        }

        const displayScreenSize = document.getElementById("display_screen_size").value;

        const iframe = document.createElement('iframe');
        iframe.src = blobUrlParm;
        iframe.classList.add('iframe_display');
        iframe.id = `iframe_${track_display[i].id}`;
        iframe.style.width = `${400 * (displayScreenSize / 100)}px`;
        iframe.style.height = `${200 * (displayScreenSize / 100)}px`;
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

    let trainNumberPrefix = "";
    let closestArrivalTime = Infinity;
    let catIndex = -1; // Closest arrival time index

    for (let i = 0; i < dataToDisplay.length; i++) {
        try {
            parseInt(dataToDisplay[i].track);
        } catch (error) {
            console.error("Error parsing track:", error);
            dataToDisplay[i].track = "0";
        }

        if (dataToDisplay[i].track === "0") {
            dataToDisplay[i].track = smallestDisplayId.toString();
        }

        if (dataToDisplay[i].track === display_id) {
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
    }

    if (catIndex === -1) {
        console.debug("No closest arrival time found on track", display_id);
        return processedData;
    }

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
            if (counts[a] !== counts[b]) {
                return counts[a] > counts[b] ? a : b;
            }
            // If counts are equal, return the first one
            return a;
        });

        processedData.operator = mostCommonOperator;
    }

    // Train prefix recognition

    for (let j = 0; j < window.operatorConvertData.categories.length; j++) {
        let prefixData = window.operatorConvertData.categories[j];
        let trainOperator = processedData.operator;
        let prefixObject = prefixData.category;

        if (prefixData.operator === trainOperator) {
            for (let key in prefixObject) {
                if (trainCategory.startsWith(key)) {
                    trainNumberPrefix = prefixObject[key];
                }
            }
        }
    }

    // Train name and prefix override

    // "overwrite":
    //{
    //  "operator": "PR",
    //  "operatorOverwrite": "ŁKA",
    //  "trainNoStartsWith": ["911"], // number can start or be all the numbers
    //  "category": { "R": "Ł", "RP": "ŁS", "M": "ŁS", "E": "ŁS" },
    //  "remarks": "Bajkowy"
    //}

    for (let j = 0; j < window.operatorConvertData.overwrite.length; j++) {
        let overwriteData = window.operatorConvertData.overwrite[j];
        let trainOperatorBefore = processedData.operator;
        let trainNoIs = overwriteData.trainNoStartsWith;

        if (overwriteData.operator === trainOperatorBefore) {
            for (let k = 0; k < trainNoIs.length; k++) {
                if (trainNo.toString().startsWith(trainNoIs[k])) {
                    const operator = overwriteData.operatorOverwrite;
                    const train_name = overwriteData.remarks;
                    trainNumberPrefix = overwriteData.category[trainCategory];
                    processedData.train_name = train_name;
                    processedData.operator = operator;
                    console.warn(`Overwrite -> Name: ${train_name}, Operator: ${operator}, Number: ${trainNumberPrefix} ${trainNo}`);
                    break;
                }
            }
        }
    }


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

    if (departureDelay > 0) {
        processedData.delay = departureDelay;
    } else if (terminatesHere === true && arrivalDelay > 0) {
        processedData.delay = arrivalDelay;
    } else {
        processedData.delay = 0;
    }

    // processedData.delay is in minutes
    if (window.settings.roundingDelay === true) {
        processedData.delay = Math.round(processedData.delay / 5) * 5;
        if (processedData.delay < 0) {
            processedData.delay = 0;
        }
    }

    processedData.empty = "false";
    processedData.terminatesHere = terminatesHere;

    //console.debug(`Processed data for track ${display_id}:`, processedData);

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
                            let platform = "0";
                            let track = "0";
                            if (comments) {
                                const match = comments.match(/(\d+),(\d+)/);
                                if (match) {
                                    platform = match[1];
                                    track = match[2];
                                }
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

    if (currentPlatformsLayout === platformsConfig) {
        console.debug("No changes in platforms layout");

        loadFrames();
        return;
    }

    platformRow.innerHTML = "";

    currentPlatformsLayout = platformsConfig;

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

function changeScreenSize() {
    const displayScreenSize = document.getElementById("display_screen_size").value;
    const iframes = document.getElementsByClassName("iframe_display");
    // Normal:
    // width: 400px;
    // height: 200px;

    for (let i = 0; i < iframes.length; i++) {
        // add % to normal size
        iframes[i].style.width = `${400 * (displayScreenSize / 100)}px`;
        iframes[i].style.height = `${200 * (displayScreenSize / 100)}px`;
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

// Button event listeners

const form = document.getElementById("form");
const menuButtonDiv = document.getElementById("hide_menu_div");
const exitButtonDiv = document.getElementById("show_menu_div");
const buttonsDiv = document.getElementById("buttons_div");
const platformRow = document.getElementById("platform_row");
const modal = document.getElementById("settings_modal");
const modalContent = document.querySelector(".modal_content");

document.getElementById("settings_button").addEventListener("click", function () {
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

document.getElementById("hide_menu_button").addEventListener("click", () => {
    if (form.style.display !== "none") {
        form.style.display = "none";
        menuButtonDiv.style.display = "none";
        exitButtonDiv.style.display = "block";
    }
    if (buttonsDiv.style.display !== "none") {
        buttonsDiv.style.display = "none";
    }
    platformRow.classList.toggle("center");
});

document.getElementById("show_menu_button").addEventListener("click", () => {
    if (form.style.display === "none") {
        form.style.display = "block";
        menuButtonDiv.style.display = "block";
        exitButtonDiv.style.display = "none";
    }
    if (buttonsDiv.style.display === "none") {
        buttonsDiv.style.display = "flex";
    }
    platformRow.classList.remove("center");
});

function sizeMinus() {
    const displayScreenSize = document.getElementById("display_screen_size");
    let displayScreenSizeValue = parseInt(displayScreenSize.value);
    if (displayScreenSizeValue > 50) {
        displayScreenSizeValue -= 5;
        displayScreenSize.value = displayScreenSizeValue;
    }
}

document.getElementById("size_minus").addEventListener("click", () => {
    sizeMinus();
});

function sizePlus() {
    const displayScreenSize = document.getElementById("display_screen_size");
    let displayScreenSizeValue = parseInt(displayScreenSize.value);
    if (displayScreenSizeValue < 230) {
        displayScreenSizeValue += 5;
        displayScreenSize.value = displayScreenSizeValue;
    }
}

document.getElementById("size_plus").addEventListener("click", () => {
    sizePlus();
});

// Rest of the event listeners

window.addEventListener("click", function (event) {
    if (event.target === document.getElementById("settings_modal")) {
        closeModal();
    }
});

// Keyboard Shortcuts

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal();
    }
    if (event.key === "F5") {
        event.preventDefault();
        window.location.reload();
    }
    if (event.key === "+") {
        sizePlus();
        if (modal.style.display !== "block") {
            applySettings(false, { displayScreenSize: "display_screen_size" });
            //showNotification(`Rozmiar: ${document.getElementById("display_screen_size").value}`);
        }
    }
    if (event.key === "-") {
        sizeMinus();
        if (modal.style.display !== "block") {
            applySettings(false, { displayScreenSize: "display_screen_size" });
            //showNotification(`Rozmiar: ${document.getElementById("display_screen_size").value}`);
        }
    }
});
