const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    const targetUrl = req.query.url;
    const proxyUrl = req.headers['x-proxy-url'];
    // Simple test to see if relay is alive
    if (!targetUrl) {
        return res.status(200).send("🚀 Discordify Relay is Active! Usage: ?url=TARGET_URL");
    }
    const config = {
        method: req.method,
        url: targetUrl,
        headers: { ...req.headers },
        data: req.method !== 'GET' ? req.body : undefined,
        validateStatus: () => true,
    };
    delete config.headers.host;
    delete config.headers.origin;
    delete config.headers['x-proxy-url'];
    if (proxyUrl) {
        config.httpsAgent = new HttpsProxyAgent(proxyUrl);
        config.proxy = false;
    }
    try {
        const response = await axios(config);
        res.status(response.status).send(response.data);
    } catch (error) {
        res.status(500).send({ error: 'Relay Failed', message: error.message });
    }
};
