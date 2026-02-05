const electron = require('electron');
console.log('Type of electron:', typeof electron);
console.log('Electron value:', electron);
console.log('Keys of electron:', Object.keys(electron || {}));
const { app } = electron;
console.log('App object:', app);
if (app) {
    app.whenReady().then(() => {
        console.log('Successfully reached whenReady');
        process.exit(0);
    });
} else {
    console.error('App is undefined!');
    process.exit(1);
}
