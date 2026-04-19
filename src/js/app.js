if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
    });
}
const video = document.getElementById('videoElement');
const canvas = document.getElementById('canvasElement');
const photoPreview = document.getElementById('photoPreview');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const locateBtn = document.getElementById('locateBtn');
const shareBtn = document.getElementById('shareBtn');

let map;
let marker;
let currentLat = null;
let currentLng = null;
let capturedBlob = null;
let stream = null;

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (err) {
        console.error(err);
        alert('Brak dostępu do kamery.');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

captureBtn.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        capturedBlob = blob;
        photoPreview.src = URL.createObjectURL(blob);

        video.classList.add('d-none');
        captureBtn.classList.add('d-none');
        photoPreview.classList.remove('d-none');
        retakeBtn.classList.remove('d-none');

        locateBtn.disabled = false;
        stopCamera();
    }, 'image/jpeg');
});

retakeBtn.addEventListener('click', () => {
    video.classList.remove('d-none');
    captureBtn.classList.remove('d-none');
    photoPreview.classList.add('d-none');
    retakeBtn.classList.add('d-none');

    locateBtn.disabled = true;
    shareBtn.disabled = true;
    capturedBlob = null;
    startCamera();
});

function initMap(lat, lng) {
    if (!map) {
        map = L.map('map').setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        marker = L.marker([lat, lng]).addTo(map);
    } else {
        map.setView([lat, lng], 16);
        marker.setLatLng([lat, lng]);
    }
}

locateBtn.addEventListener('click', () => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                currentLat = position.coords.latitude;
                currentLng = position.coords.longitude;
                initMap(currentLat, currentLng);
                shareBtn.disabled = false;
            },
            err => {
                console.error(err);
                alert('Nie udało się pobrać lokalizacji. Upewnij się, że GPS jest włączony.');
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert('Geolokalizacja nie jest wspierana w tej przeglądarce.');
    }
});

shareBtn.addEventListener('click', async () => {
    if (!navigator.canShare) {
        alert('Twoja przeglądarka nie wspiera Web Share API.');
        return;
    }

    const file = new File([capturedBlob], 'konfitura-zgloszenie.jpg', { type: 'image/jpeg' });
    const mapsLink = `https://www.openstreetmap.org/?mlat=${currentLat}&mlon=${currentLng}#map=18/${currentLat}/${currentLng}`;

    const shareData = {
        title: 'Zgłoszenie - Konfitura',
        text: `Zobacz zgłoszenie z lokalizacji: ${mapsLink}`,
        files: [file]
    };

    if (navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error(err);
        }
    } else {
        alert('Udostępnianie plików nie jest wspierane. Spróbuj udostępnić sam link w inny sposób.');
    }

    
});


startCamera();

let offlineBanner = null;

window.addEventListener('offline', () => {
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.innerText = 'Jesteś w trybie offline';
        offlineBanner.style.background = 'black';
        offlineBanner.style.color = 'white';
        offlineBanner.style.textAlign = 'center';
        offlineBanner.style.padding = '3px';
        offlineBanner.style.fontSize = '12px';
        offlineBanner.style.position = 'sticky';
        offlineBanner.style.top = '0';
        offlineBanner.style.zIndex = '1000';

        const main = document.querySelector('main');
        main.prepend(offlineBanner);
    }
});

window.addEventListener('online', () => {
    if (offlineBanner) {
        offlineBanner.remove();
        offlineBanner = null;
    }
});