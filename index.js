window.timetablesAPI_URL = 'https://stacjownik.spythere.eu/api/getActiveTrainList';
window.sceneryAPI_URL = 'https://stacjownik.spythere.eu/api/getSceneries';
window.platformsAPI_URL = 'https://raw.githubusercontent.com/Ja-Tar/WTIP/main/platforms_info.json'
window.timetablesData = [];
window.platformsData = [];
window.checkpointData = [];
window.platformsVersionID = "0.0.5"

document.getElementById("submit").addEventListener("click", function () {
    buttonSetDisplay();
});

function buttonSetDisplay() {
    let platformsLayout = document.getElementById("platforms_layout");

    showDisplays(platformsLayout.value);
}

function createIframe() {
    const track_display = document.getElementsByClassName('track_display');

    fetch('template_WAW_ZACH.html')
        .then(response => response.blob())
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);

            for (let i = 0; i < track_display.length; i++) {
                const { time, train_number, destination, via_stations, operator, info_bar, delay, colorbar, colorfont, empty} = getProcessedData(track_display[i].id);
                const params = `time=${time}&train_number=${train_number}&destination=${destination}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}&empty=${empty}`;
                const blobUrlParm = blobUrl + "#" + encodeURIComponent(params);
                
                const iframe = document.createElement('iframe');
                iframe.src = blobUrlParm;
                iframe.classList.add('iframe_display');
                track_display[i].appendChild(iframe);
            }
        });
}

function getProcessedData(display_id) {
    let json = {};
    json.time = "221";
    json.train_number = "22";
    json.destination = "22";
    json.via_stations = "22";
    json.operator = "22";
    json.info_bar = `Peron: ${display_id}`;
    json.delay = 0;
    json.colorbar = "#2f353d";
    json.colorfont = "#ffffff";
    json.empty = "true";

    return json;
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
            updateTextScenery();
        });
    });
    //getTimetablesAPI();


    window.localStorage.setItem("version", window.platformsVersionID);

    setTimeout(() => {
        //getTimetablesAPI();
        //getPlatformsAPI();
        //getSceneryAPI();
        //updateTextScenery();
    }, 60000);
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
        platformName.innerHTML = "Peron " + platformNumber;
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
            trackName.innerHTML = "Tor " + trackNumbers[j];
            trackDisplay.appendChild(trackName);
        }
    }

    createIframe();
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
        option.innerHTML = "Nie wybrano";
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

/* Testing
function updateDisplay() {

}

setTimeout(() => {
    updateDisplay();
    setInterval(updateDisplay, 240000);
}, 240000);

*/

createIframe();
getDataFromAPI();