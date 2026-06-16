const axios = require('axios');
const https = require('https');

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
    console.log(`🚀 Tentative via Proxy : ${randomProxy.split('@')[1]}`);

    // Extraction des composants du proxy pour Axios
    const proxyUrl = new URL(randomProxy);
    
    const url = "https://mobile.sls.microsoft.com/sls/ws/ActivationService.asmx";
    const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><BatchActivate xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"><request><Digest>None</Digest><RequestXml>&lt;ActivationRequest xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"&gt;&lt;VersionNumber&gt;3.2&lt;/VersionNumber&gt;&lt;RequestType&gt;2&lt;/RequestType&gt;&lt;Info&gt;&lt;IID&gt;${iid}&lt;/IID&gt;&lt;/Info&gt;&lt;/ActivationRequest&gt;</RequestXml></request></BatchActivate></soap:Body></soap:Envelope>`;

    try {
        const response = await axios.post(url, xml, {
            // Configuration native d'Axios pour les proxys
            proxy: {
                protocol: 'http',
                host: proxyUrl.hostname,
                port: proxyUrl.port,
                auth: {
                    username: proxyUrl.username,
                    password: proxyUrl.password
                }
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '"http://www.microsoft.com/DRM/SL/BatchActivation/1.0/BatchActivate"',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            }
        });

        const match = response.data.match(/&lt;CID&gt;(\d+)&lt;\/CID&gt;/);
        if (match) {
            console.log("\n✅ CID TROUVÉ : " + match[1]);
        } else {
            // --- NOUVEAU : Analyse intelligente de l'erreur Microsoft ---
            console.log("\n❌ Microsoft a refusé de générer le CID.");

            // Recherche des codes d'erreur dans le XML renvoyé
            const errCodeMatch = response.data.match(/&lt;ErrorCode&gt;(0x[0-9A-Fa-f]+)&lt;\/ErrorCode&gt;/i) || response.data.match(/<faultcode>(.*?)<\/faultcode>/i);
            const errDescMatch = response.data.match(/&lt;Description&gt;(.*?)&lt;\/Description&gt;/i) || response.data.match(/<faultstring>(.*?)<\/faultstring>/i);

            if (errCodeMatch) {
                // Nettoyage au cas où des balises HTML/XML subsistent
                const code = errCodeMatch[1].replace(/(<([^>]+)>)/gi, "").toUpperCase();
                console.log("Code d'erreur : " + code);

                if (code === '0XC004C008' || code === '0XC004C020') {
                    console.log("Diagnostic  : La clé est bloquée ou sa limite d'activation est atteinte (Exceeded/Blocked).");
                } else if (errDescMatch) {
                    const desc = errDescMatch[1].replace(/(<([^>]+)>)/gi, "");
                    console.log("Raison      : " + desc);
                }
            } else {
                // Si le format d'erreur est inconnu, on affiche un bout de la réponse brute pour déboguer
                console.log("Détail brut : " + response.data.substring(0, 200).replace(/\n/g, ' '));
            }
        }
    } catch (error) {
        console.error("❌ Erreur : " + error.message);
    }
}

runActivation();
