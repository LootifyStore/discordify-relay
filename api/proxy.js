const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-proxy-url')
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    const targetUrl = req.query.url;
    const proxyUrl = req.headers['x-proxy-url']; // This comes from the Dashboard app
    if (!targetUrl) return res.status(400).send('No URL provided');
    const config = {
        method: req.method,
        url: targetUrl,
        headers: { ...req.headers },
        data: req.method !== 'GET' ? req.body : undefined,
        validateStatus: () => true,
    };
    // Remove headers that browser might complain about
    delete config.headers.host;
    delete config.headers.origin;
    delete config.headers['x-proxy-url'];
    // If you provided a proxy in the Dashboard settings, the relay uses it here
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
