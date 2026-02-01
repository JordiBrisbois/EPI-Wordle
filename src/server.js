const app = require('./app');
const CONFIG = require('./config/config');
const os = require('os');
const chatController = require('./controllers/chatController');

app.listen(CONFIG.PORT, () => {
    console.log('EPI-Wordle Refactored Server Started!');
    console.log('=====================================');
    console.log('Server: http://localhost:' + CONFIG.PORT);

    // Add system message to chat
    chatController.addSystemMessage('Serveur EPI-Wordle redemarre ! Bon jeu a tous !');

    // Display local IP addresses
    const interfaces = os.networkInterfaces();
    console.log('\nAcces reseau local:');

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log('   http://' + iface.address + ':' + CONFIG.PORT);
            }
        }
    }
});
