function createIframe() {
    const track_display = document.getElementsByClassName('track_display');


    // Set the source of the iframe to a Blob URL
    fetch('template_WAW_ZACH.html')
        .then(response => response.blob())
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);
            blobUrl += '#time=12:02&train_number=222&destination=222&via_stations=222&operator=222&info_bar=222&delay=0&colorbar=%232f353d&colorfont=%23ffffff'; // Proff of concept
            for (let i = 0; i < track_display.length; i++) {
                const iframe = document.createElement('iframe');
                iframe.src = blobUrl;
                iframe.classList.add('iframe_display');
                track_display[i].appendChild(iframe);
            }
        });
}

createIframe();