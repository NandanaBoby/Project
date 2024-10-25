let audioContext;
let analyser;
let microphone;
let dataArray;

const canvas = document.getElementById('waveform');
const canvasCtx = canvas.getContext('2d');

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

    // Stop measuring if the decibel level exceeds 150 dB
    if (adjustedDecibels >= 150) {
        stopMeasuring();
    } else {
        // Slow down the animation by adjusting the requestAnimationFrame timing
        setTimeout(measureSound, 100); // Adjust time interval (100ms)
    }
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

        // Adjust for a straight line wave effect
        if (i > 0) {
            const prevX = (i - 1) * barWidth;
            const prevY = (data[i - 1] - 128) / 128 * (canvas.height / 2) + (canvas.height / 2);
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
