const WebSocket = require('ws');

async function run() {
    const wsUrl = process.env.AGY_BROWSER_WS_URL;
    if (!wsUrl) {
        console.error("AGY_BROWSER_WS_URL is not set");
        return;
    }
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
        ws.send(JSON.stringify({
            id: 1,
            method: 'Target.getTargets'
        }));
    });
    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        console.log(JSON.stringify(msg, null, 2));
        ws.close();
    });
    ws.on('error', (err) => {
        console.error(err);
    });
}
run();
