let audioContext;
let analyser;
let microphone;
let dataArray;

const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');

const memes = [
    'https://platform.polygon.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/22512212/shrek4_disneyscreencaps.com_675.jpg?quality=90&strip=all&crop=44.127604166667%2C30.392156862745%2C36.953125%2C57.96568627451&w=750'
    // Add more meme URLs as needed
];

let lastDisplayedDecibels = -20; // Initialize to a value below the lowest threshold

document.getElementById('start').addEventListener('click', startMeasuring);
document.getElementById('stop').disabled = true;

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

    // Check if the decibel level has increased by 20 dB
    if (adjustedDecibels >= lastDisplayedDecibels + 45) {
        displayRandomMeme();
        lastDisplayedDecibels = adjustedDecibels; // Update last displayed level
    }

    // Stop measuring if the decibel level exceeds 100 dB
    if (adjustedDecibels >= 100) {
        stopMeasuring();
    } else {
        setTimeout(measureSound, 100); // Adjust time interval (100ms)
    }
}

function displayRandomMeme() {
    const memeImg = document.getElementById('meme');
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    memeImg.src = randomMeme;
    memeImg.style.display = 'block'; // Show the meme
    memeImg.style.opacity = 1; // Set opacity to 1 for pop-in effect

    // Use setTimeout to fade out the meme after 2 seconds
    setTimeout(() => {
        memeImg.style.opacity = 0; // Set opacity to 0 for pop-out effect
        setTimeout(() => {
            memeImg.style.display = 'none'; // Hide the meme after fade-out
        }, 500); // Wait for the fade-out transition to complete
    }, 2000); // Meme stays visible for 2 seconds
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
