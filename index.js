window.timetablesAPI_URL = 'https://stacjownik.spythere.eu/api/getActiveTrainList';
window.timetablesData = [];

function createIframe() {
    const track_display = document.getElementsByClassName('track_display');

    // Set the source of the iframe to a Blob URL
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

/* Testing
function getDataFromAPI() {
    fetch(window.timetablesAPI_URL)
        .then(response => response.json())
        .then(data => {
            window.timetablesData = data;
        });
}

function updateDisplay() {

}

setTimeout(() => {
    updateDisplay();
    setInterval(updateDisplay, 240000);
}, 240000);

*/

createIframe();