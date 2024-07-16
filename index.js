function createIframe() {
    const track_display = document.getElementsByClassName('track_display');


    // Set the source of the iframe to a Blob URL
    fetch('template_WAW_ZACH.html')
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            for (let i = 0; i < track_display.length; i++) {
                const iframe = document.createElement('iframe');
                iframe.src = blobUrl;
                track_display[i].appendChild(iframe);
            }
        });
}

createIframe();