// Funzione per aggiornare i LED in base al valore
function updateLEDs(container, value, max, segments) {
    const leds = container.querySelectorAll('.led-segment');
    const threshold = max / segments;
    
    leds.forEach((led, index) => {
        led.classList.remove('high', 'medium', 'low');
        if (index * threshold <= value) {
            if (index >= segments * 0.8) led.classList.add('high');
            else if (index >= segments * 0.5) led.classList.add('medium');
            else led.classList.add('low');
        }
    });
}

// Funzione per aggiornare i valori
function updateValues() {
    // Simula velocità
    const speed = Math.floor(Math.random() * 45);
    document.querySelector('.speed-number').textContent = speed;

    // Simula batteria (0-100%)
    const battery = Math.floor(Math.random() * 100);
    document.getElementById('battery').textContent = battery + '%';
    updateLEDs(document.querySelector('.battery-segments'), battery, 100, 10);

    // Simula livello assistenza
    const assistLevels = ['ECO', 'TRAIL', 'TURBO'];
    const currentAssist = assistLevels[Math.floor(Math.random() * 3)];
    document.getElementById('assist-level').textContent = currentAssist;
    updateLEDs(document.querySelector('.assist-levels'), 
        assistLevels.indexOf(currentAssist) + 1, 3, 3);

    // Simula potenza (0-500W)
    const power = Math.floor(Math.random() * 500);
    document.getElementById('power').textContent = power + ' W';
    updateLEDs(document.querySelector('.power-segments'), power, 500, 8);

    // Simula cadenza (0-120 RPM)
    const cadence = Math.floor(Math.random() * 120);
    document.getElementById('cadence').textContent = cadence;

    // Simula pendenza (-10% a +20%)
    const slope = Math.floor(Math.random() * 30) - 10;
    document.getElementById('slope').textContent = slope + '%';
    updateLEDs(document.querySelector('.slope-segments'), 
        Math.abs(slope), 20, 5);

    // Simula autonomia (0-100 km)
    const range = Math.floor(Math.random() * 100);
    document.getElementById('range').textContent = range;
}

// Aggiorna i valori ogni 2 secondi
setInterval(updateValues, 2000);

// Inizializza i valori all'avvio
document.addEventListener('DOMContentLoaded', updateValues);
