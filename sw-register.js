if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registrato con successo:', registration.scope);
            })
            .catch((error) => {
                console.log('Registrazione ServiceWorker fallita:', error);
            });
    });
}