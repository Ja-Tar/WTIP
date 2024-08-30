window.timetablesAPI_URL = 'https://stacjownik.spythere.eu/api/getActiveTrainList';
window.sceneryAPI_URL = 'https://stacjownik.spythere.eu/api/getSceneries';
window.platformsAPI_URL = 'https://raw.githubusercontent.com/Ja-Tar/WTIP/main/platforms_info.json'
window.timetablesData = [];
window.platformsData = [];
window.versionID = "0.0.1"

function createIframe() {
    const track_display = document.getElementsByClassName('track_display');

    fetch('template_WAW_ZACH.html')
        .then(response => response.blob())
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);

            for (let i = 0; i < track_display.length; i++) {
                const { time, train_number, destination, via_stations, operator, info_bar, delay, colorbar, colorfont } = getProcessedData(i);
                const blobUrlParm = blobUrl + `#time=${time}&train_number=${train_number}&destination=${destination}&via_stations=${via_stations}&operator=${operator}&info_bar=${info_bar}&delay=${delay}&colorbar=${colorbar}&colorfont=${colorfont}`;

                const iframe = document.createElement('iframe');
                iframe.src = blobUrlParm;
                iframe.classList.add('iframe_display');
                track_display[i].appendChild(iframe);
            }
        });
}

function getProcessedData(display_id) {
    let json = {};
    json.time = "12:01";
    json.train_number = "222";
    json.destination = "222";
    json.via_stations = "222";
    json.operator = "222";
    json.info_bar = `id: ${display_id}`;
    json.delay = 0;
    json.colorbar = "#2f353d";
    json.colorfont = "#ffffff";

    return json;
}


function getDataFromAPI() {
    let saved = false;
    let sceneryInput = document.getElementById("scenery");

    sceneryInput.setAttribute('list', 'scenery_list');

    if (window.localStorage.getItem("version") === window.versionID) {
        saved = true;
    }

    getSceneryAPI().then(() => {
        updateTextScenery();
    });
    //getTimetablesAPI();
    //getPlatformsAPI(saved);
    

    window.localStorage.setItem("version", window.versionID);

    setTimeout(() => {
        //getTimetablesAPI();
        //getPlatformsAPI();
        //getSceneryAPI();
        //updateTextScenery();
    }, 60000);
}

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
}

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
        window.platformsData = savedData;
    } else {
        await fetch(window.platformsAPI_URL)
            .then(response => response.json())
            .then(data => {
                window.platformsData = data;
                window.localStorage.setItem("platformsData", JSON.stringify(data));
            });
    }
}

async function getSceneryAPI() {
    await fetch(window.sceneryAPI_URL)
        .then(response => response.json())
        .then(data => {
            window.sceneryData = data;
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

createIframe();
getDataFromAPI();