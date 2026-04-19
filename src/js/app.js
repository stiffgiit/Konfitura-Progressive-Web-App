if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('src/js/sw.js').catch(err => console.error(err));
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

function showAppModal(message, isPrompt = false, promptValue = '') {
    const modalBody = document.getElementById('infoModalBody');
    if (isPrompt) {
        modalBody.innerHTML = `<p>${message}</p><input type="text" class="form-control" value="${promptValue}" readonly>`;
    } else {
        modalBody.innerHTML = `<p>${message}</p>`;
    }
    const modalInstance = new bootstrap.Modal(document.getElementById('infoModal'));
    modalInstance.show();
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
        video.srcObject = stream;
    } catch (err) {
        console.error(err);
        showAppModal('Brak dostępu do kamery.');
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
                showAppModal('Nie udało się pobrać lokalizacji. Upewnij się, że GPS jest włączony.');
            },
            {enableHighAccuracy: true}
        );
    } else {
        showAppModal('Geolokalizacja nie jest wspierana w tej przeglądarce.');
    }
});

shareBtn.addEventListener('click', async () => {
    const file = new File([capturedBlob], 'konfitura-zgloszenie.jpg', {type: 'image/jpeg'});
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
    const shareText = `Zgłoszenie nieprawidłowości z lokalizacji: ${mapsLink}`;

    const shareData = {
        title: 'Zgłoszenie - Konfitura',
        text: shareText,
        files: [file]
    };

    let canUseWebShare = false;
    if (navigator.canShare && navigator.canShare(shareData)) {
        canUseWebShare = true;
    }

    if (canUseWebShare) {
        try {
            await navigator.clipboard.writeText(shareText);
            showAppModal('Link do mapy został skopiowany do schowka. Jeśli komunikator wyśle samo zdjęcie, wklej link z lokalizacją w wiadomości tekstowej.');
            await navigator.share(shareData);
        } catch (err) {
            console.error(err);
        }
    } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(capturedBlob);
        link.download = 'konfitura-zgloszenie.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const encodedMessage = encodeURIComponent(shareText);
        const encodedSubject = encodeURIComponent('Zgłoszenie - Konfitura');

        document.getElementById('btnShareWhatsApp').href = `https://web.whatsapp.com/send?text=${encodedMessage}`;
        document.getElementById('btnShareEmail').href = `mailto:?subject=${encodedSubject}&body=${encodedMessage}`;

        const desktopModal = new bootstrap.Modal(document.getElementById('desktopShareModal'));
        desktopModal.show();
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
