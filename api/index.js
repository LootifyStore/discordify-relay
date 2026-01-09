const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
module.exports = async (req, res) => {
    // 1. Setup CORS
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.method === 'OPTIONS') return res.status(200).end();
    const targetUrl = req.query.url;
    const proxyUrl = req.headers['x-proxy-url'];
    // 2. Health Check
    if (!targetUrl) {
        return res.status(200).send("🚀 Invisible Relay is ACTIVE!\nProxy: " + (proxyUrl ? "Configured" : "None"));
    }
    // 3. Prepare Clean Headers (SHRED IDENTITY)
    const cleanHeaders = { ...req.headers };
    // Remove headers that leak your home IP or cause CORS issues
    delete cleanHeaders.host;
    delete cleanHeaders.origin;
    delete cleanHeaders.referer;
    delete cleanHeaders['x-proxy-url'];
    delete cleanHeaders['x-forwarded-for'];
    delete cleanHeaders['x-real-ip'];
    delete cleanHeaders['x-vercel-forwarded-for'];
    const config = {
        method: req.method,
        url: targetUrl,
        headers: cleanHeaders,
        data: req.method !== 'GET' ? req.body : undefined,
        validateStatus: () => true,
        timeout: 10000
    };
    // 4. Attach Proxy Agent (Supports HTTP and SOCKS5)
    if (proxyUrl) {
        try {
            if (proxyUrl.startsWith('socks')) {
                config.httpsAgent = new SocksProxyAgent(proxyUrl);
            } else {
                config.httpsAgent = new HttpsProxyAgent(proxyUrl);
            }
            config.proxy = false;
        } catch (e) {
            return res.status(400).send({ error: 'Proxy Configuration Error', message: e.message });
        }
    }
    try {
        const response = await axios(config);
        res.status(response.status).send(response.data);
    } catch (error) {
        res.status(500).send({ 
            error: 'Relay Connection Failed', 
            message: error.message,
            proxyUsed: !!proxyUrl 
        });
    }
};
