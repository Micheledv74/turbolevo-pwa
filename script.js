// Costanti Specialized Turbo Levo
const SPECIALIZED_CONSTANTS = {
    SERVICES: {
        MAIN: '00000003-0000-4b49-4e4f-525441474947',
        INFO: '00000001-0000-4b49-4e4f-525441474947',
        BATTERY: '00000002-0000-4b49-4e4f-525441474947'
    },
    CHARACTERISTICS: {
        DATA: '00000013-0000-4b49-4e4f-525441474947',
        BATTERY: '00000012-0000-4b49-4e4f-525441474947'
    },
    LIMITS: {
        MAX_POWER: 565, // Watts
        MAX_SPEED: 25,  // km/h (EU limit)
        BATTERY_CAPACITY: 700 // Wh
    }
};

// Variabili globali per gestire la connessione
let turboLevoDevice = null;
let turboLevoServer = null;
let isConnected = false;
let dataCharacteristic = null;
let batteryCharacteristic = null;

// Funzione per iniziare la connessione Bluetooth
async function connectTurboLevo() {
    try {
        console.log('Ricerca della Turbo Levo...');
        
        turboLevoDevice = await navigator.bluetooth.requestDevice({
            filters: [
                {
                    services: [
                        SPECIALIZED_CONSTANTS.SERVICES.MAIN,
                        SPECIALIZED_CONSTANTS.SERVICES.BATTERY
                    ]
                }
            ]
        });

        console.log('Dispositivo trovato:', turboLevoDevice.name);

        // Gestione disconnessione
        turboLevoDevice.addEventListener('gattserverdisconnected', onDisconnected);

        // Connessione al server GATT
        console.log('Connessione al server GATT...');
        turboLevoServer = await turboLevoDevice.gatt.connect();
        
        isConnected = true;
        updateConnectionStatus('Connesso');
        
        // Inizia la lettura dei dati
        await startDataReading();

    } catch (error) {
        console.error('Errore durante la connessione:', error);
        updateConnectionStatus('Errore: ' + error.message);
    }
}

// Gestione disconnessione
function onDisconnected() {
    console.log('Dispositivo disconnesso');
    isConnected = false;
    updateConnectionStatus('Disconnesso');
    dataCharacteristic = null;
    batteryCharacteristic = null;
}

// Aggiorna lo stato della connessione nell'UI
function updateConnectionStatus(status) {
    let statusElement = document.getElementById('connection-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.style.position = 'absolute';
        statusElement.style.top = '10px';
        statusElement.style.right = '10px';
        statusElement.style.padding = '5px 10px';
        statusElement.style.borderRadius = '5px';
        document.body.appendChild(statusElement);
    }
    
    statusElement.textContent = status;
    statusElement.style.backgroundColor = status === 'Connesso' ? '#4CAF50' : '#ff5252';
    statusElement.style.color = 'white';
}

// Funzione per avviare la lettura dei dati
async function startDataReading() {
    if (!isConnected) return;
    
    try {
        // Ottieni il servizio principale
        const mainService = await turboLevoServer.getPrimaryService(SPECIALIZED_CONSTANTS.SERVICES.MAIN);
        const batteryService = await turboLevoServer.getPrimaryService(SPECIALIZED_CONSTANTS.SERVICES.BATTERY);

        // Ottieni le caratteristiche
        dataCharacteristic = await mainService.getCharacteristic(SPECIALIZED_CONSTANTS.CHARACTERISTICS.DATA);
        batteryCharacteristic = await batteryService.getCharacteristic(SPECIALIZED_CONSTANTS.CHARACTERISTICS.BATTERY);

        // Avvia le notifiche
        await dataCharacteristic.startNotifications();
        await batteryCharacteristic.startNotifications();

        // Aggiungi i listener
        dataCharacteristic.addEventListener('characteristicvaluechanged', handleDataChange);
        batteryCharacteristic.addEventListener('characteristicvaluechanged', handleBatteryChange);
        
        console.log('Lettura dati avviata');
    } catch (error) {
        console.error('Errore nella lettura dei dati:', error);
        updateConnectionStatus('Errore lettura');
    }
}

// Funzione per gestire i cambiamenti nei dati principali
function handleDataChange(event) {
    const value = event.target.value;
    const dataView = new DataView(value.buffer);
    
    // Lettura dei valori dai byte ricevuti
    const speed = dataView.getUint16(0, true) / 100; // km/h
    const power = dataView.getUint16(2, true); // Watts
    const cadence = dataView.getUint8(4); // RPM
    const assistMode = dataView.getUint8(5); // 0=ECO, 1=TRAIL, 2=TURBO
    const slope = dataView.getInt8(6); // percentuale
    
    // Aggiorna UI
    document.querySelector('.speed-number').textContent = Math.round(speed);
    document.getElementById('power').textContent = power + ' W';
    document.getElementById('cadence').textContent = cadence;
    document.getElementById('slope').textContent = slope + '%';
    
    // Aggiorna livello assistenza
    const assistModes = ['ECO', 'TRAIL', 'TURBO'];
    document.getElementById('assist-level').textContent = assistModes[assistMode];
    
    // Aggiorna LED
    updateLEDs(document.querySelector('.power-segments'), power, SPECIALIZED_CONSTANTS.LIMITS.MAX_POWER, 8);
    updateLEDs(document.querySelector('.assist-levels'), assistMode + 1, 3, 3);
    updateLEDs(document.querySelector('.slope-segments'), Math.abs(slope), 20, 5);
}

// Funzione per gestire i cambiamenti nella batteria
function handleBatteryChange(event) {
    const value = event.target.value;
    const dataView = new DataView(value.buffer);
    
    const batteryPercent = dataView.getUint8(0); // percentuale
    const range = dataView.getUint8(1); // km stimati rimanenti
    
    // Aggiorna UI
    document.getElementById('battery').textContent = batteryPercent + '%';
    document.getElementById('range').textContent = range;
    
    // Aggiorna LED batteria
    updateLEDs(document.querySelector('.battery-segments'), batteryPercent, 100, 10);
}

// Funzione per aggiornare i LED
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

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se il browser supporta il Bluetooth
    if (!navigator.bluetooth) {
        alert('Il tuo browser non supporta il Bluetooth. Per favore usa un browser compatibile.');
        return;
    }
    
    // Aggiungi pulsante di connessione
    const connectButton = document.createElement('button');
    connectButton.textContent = 'Connetti Turbo Levo';
    connectButton.style.position = 'absolute';
    connectButton.style.top = '10px';
    connectButton.style.left = '10px';
    connectButton.style.padding = '10px';
    connectButton.style.borderRadius = '5px';
    connectButton.style.backgroundColor = '#4CAF50';
    connectButton.style.color = 'white';
    connectButton.style.border = 'none';
    connectButton.style.cursor = 'pointer';
    
    connectButton.addEventListener('click', connectTurboLevo);
    document.body.appendChild(connectButton);
});
