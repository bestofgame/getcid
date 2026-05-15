const axios = require('axios');
const https = require('https');
// Importation compatible avec la version 5.x
const HttpsProxyAgent = require('https-proxy-agent');

const proxyList = [
    "http://tmmpphzg:koq8hgnhmbls@142.111.48.253:7030",
    "http://tmmpphzg:koq8hgnhmbls@23.95.150.145:6114",
    "http://tmmpphzg:koq8hgnhmbls@45.38.107.97:6014",
    "http://tmmpphzg:koq8hgnhmbls@38.154.203.95:5863",
    "http://tmmpphzg:koq8hgnhmbls@198.23.243.226:6361",
    "http://tmmpphzg:koq8hgnhmbls@84.247.60.125:6095",
    "http://tmmpphzg:koq8hgnhmbls@104.239.107.47:5699",
    "http://tmmpphzg:koq8hgnhmbls@23.27.208.120:5830",
    "http://tmmpphzg:koq8hgnhmbls@23.229.19.94:8689",
    "http://tmmpphzg:koq8hgnhmbls@2.57.20.2:6983"
];

async function runActivation() {
    const iid = process.argv[2] ? process.argv[2].replace(/\D/g, '') : '';
    if (iid.length < 54) {
        console.log("❌ IID trop court.");
        return;
    }

    const randomProxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    // Initialisation de l'agent
    const proxyAgent = new HttpsProxyAgent(randomProxy);

    console.log(`🚀 Tentative via Proxy : ${randomProxy.split('@')[1]}`);

    const url = "https://mobile.sls.microsoft.com/sls/ws/ActivationService.asmx";
    const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><BatchActivate xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"><request><Digest>None</Digest><RequestXml>&lt;ActivationRequest xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"&gt;&lt;VersionNumber&gt;3.2&lt;/VersionNumber&gt;&lt;RequestType&gt;2&lt;/RequestType&gt;&lt;Info&gt;&lt;IID&gt;${iid}&lt;/IID&gt;&lt;/Info&gt;&lt;/ActivationRequest&gt;</RequestXml></request></BatchActivate></soap:Body></soap:Envelope>`;

    try {
        const response = await axios.post(url, xml, {
            httpsAgent: proxyAgent,
            proxy: false, // Désactive le proxy interne d'Axios pour utiliser l'agent
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '"http://www.microsoft.com/DRM/SL/BatchActivation/1.0/BatchActivate"',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            }
        });

        const match = response.data.match(/&lt;CID&gt;(\d+)&lt;\/CID&gt;/);
        if (match) {
            console.log("\n========================================");
            console.log("🎯 CONFIRMATION ID (CID) : " + match[1]);
            console.log("========================================\n");
        } else {
            console.log("\n❌ Microsoft a répondu mais pas de CID.");
            console.log("Réponse : " + response.data.substring(0, 250));
        }
    } catch (error) {
        console.error("❌ Erreur Proxy : " + error.message);
    }
}

runActivation();
