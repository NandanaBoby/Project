// script.js

let audioContext;
let microphone;
let analyser;
let dataArray;
const THRESHOLD_DB = -20; // Set the dB threshold for stopping (you can adjust this value)

document.getElementById("startButton").addEventListener("click", startListening);

function startListening() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048; // Set the FFT size for frequency analysis

            microphone.connect(analyser);

            dataArray = new Uint8Array(analyser.frequencyBinCount);
            processAudio(); // Start the audio processing loop
        })
        .catch(err => {
            console.error("Error accessing microphone:", err);
        });
}

function processAudio() {
    if (!analyser) return;

    // Get the current sound intensity levels
    analyser.getByteFrequencyData(dataArray);

    // Calculate the average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    let average = sum / dataArray.length;

    // Display intensity in dB
    let intensityDb = average > 0 ? 20 * Math.log10(average) : -Infinity;

    document.getElementById("intensity").innerText = `Sound Intensity: ${intensityDb.toFixed(2)} dB`;

    // Animate based on sound intensity
    animateVisual(average);

    // Check if the sound intensity exceeds the threshold
    if (intensityDb > THRESHOLD_DB) {
        stopListening(); // Stop listening if intensity exceeds threshold
    } else {
        requestAnimationFrame(processAudio); // Call the function again for continuous processing
    }
}

function stopListening() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    document.getElementById("intensity").innerText = "Listening stopped due to high intensity.";
    resetVisual(); // Reset visual element when stopping
}

function animateVisual(average) {
    const visual = document.getElementById("visual");
    const scaleFactor = average / 255; // Scale average value to a 0-1 range
    const scale = 1 + scaleFactor; // Scale factor to make it bounce
    visual.style.transform = `scale(${scale})`; // Scale the visual element
    visual.style.backgroundColor = `rgba(255, ${Math.min(255, scaleFactor * 255)}, 0, 0.5)`; // Change color based on intensity
}

function resetVisual() {
    const visual = document.getElementById("visual");
    visual.style.transform = 'scale(1)'; // Reset scale
    visual.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Reset background color
}
