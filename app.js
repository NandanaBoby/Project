let audioContext;
let analyser;
let microphone;
let dataArray;

const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');

// Array of objects containing decibel thresholds and corresponding meme URLs
const memes = [
    { threshold: 45, url: 'https://media1.tenor.com/m/DBDpIRGsqH8AAAAd/dance.gif' }, // Low scream
    { threshold: 55, url: 'https://media.tenor.com/MzNar3M97SYAAAAi/shrek-my-honest-reaction.gif' }, // Medium scream
    { threshold: 65, url: 'https://media1.tenor.com/m/FWGu8g6PsD8AAAAC/shrek.gif' }, // High scream
    { threshold: 75, url: 'https://media1.tenor.com/m/otzq-FJMJmoAAAAC/wsup-bring.gif' } // Max scream
];

let lastDisplayedDecibels = -20; // Initialize to a value below the lowest threshold

document.getElementById('start').addEventListener('click', startMeasuring);
document.getElementById('close-popup').addEventListener('click', closePopup);

async function startMeasuring() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(microphone);
    source.connect(analyser);

    dataArray = new Uint8Array(analyser.fftSize);
    
    document.getElementById('start').disabled = true;
    
    measureSound();
}

function stopMeasuring() {
    microphone.getTracks().forEach(track => track.stop());
    audioContext.close();
    
    document.getElementById('start').disabled = false;
    document.getElementById('output').innerText += ' (Stopped: Max dB reached)';
}

function measureSound() {
    analyser.getByteTimeDomainData(dataArray);

    // Calculate the average power (RMS)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const x = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
        sum += x * x;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Convert RMS to Decibels (dB)
    const decibels = 20 * Math.log10(rms);
    const adjustedDecibels = Math.max(0, Math.round(decibels + 90));

    document.getElementById('output').innerText = `Decibels: ${adjustedDecibels}`;

    drawWaveform(dataArray);

    // Check if the current decibel level is above any defined thresholds
    memes.forEach(meme => {
        if (adjustedDecibels >= meme.threshold && lastDisplayedDecibels < meme.threshold) {
            displayMeme(meme.url); // Display the meme corresponding to the threshold
            lastDisplayedDecibels = adjustedDecibels; // Update last displayed level
        }
    });

    // Stop measuring if the decibel level exceeds 100 dB
    if (adjustedDecibels >= 100) {
        stopMeasuring();
    } else {
        setTimeout(measureSound, 100); // Adjust time interval (100ms)
    }
}

function displayMeme(url) {
    const popup = document.getElementById('popup');
    const popupGif = document.getElementById('popup-gif');

    popupGif.src = url; // Set the source of the pop-up GIF
    popup.style.display = 'block'; // Show the pop-up
}
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none'; // Hide the pop-up
}

function drawWaveform(data) {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background color
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(240, 240, 240, 0.3)'); // Light gray
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.3)'); // Darker gray
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / (data.length - 1); // Width of each point
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2); // Start from the center

    for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128; // Normalize to -1 to 1
        const y = (v * (canvas.height / 2)) + (canvas.height / 2); // Scale and center vertically

        // Draw the waveform
        if (i > 0) {
            canvasCtx.lineTo(i * barWidth, y); // Create line to current point
        } else {
            canvasCtx.moveTo(i * barWidth, y); // Move to the first point
        }
    }

    // Set color for the wave to lighter blue
    canvasCtx.strokeStyle = 'rgba(135, 206, 250, 0.8)'; // Light blue with some transparency
    canvasCtx.lineWidth = 2; // Line width
    canvasCtx.stroke(); // Draw the line
}
