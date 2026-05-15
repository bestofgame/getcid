const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function getCID() {
    const iid = process.argv[2] ? process.argv[2].replace(/\D/g, '') : '';
    if (iid.length < 54) {
        console.log("❌ IID trop court.");
        return;
    }

    // ON UTILISE L'IP DIRECTE (Trouvée via serveurs non-censurés)
    // L'IP 20.112.250.133 appartient à Microsoft Azure / SLS
    const directIpUrl = "https://20.112.250.133/sls/ws/ActivationService.asmx";
    
    console.log("🚀 Connexion forcée via IP directe (20.112.250.133)...");

    const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><BatchActivate xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"><request><Digest>None</Digest><RequestXml>&lt;ActivationRequest xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"&gt;&lt;VersionNumber&gt;3.2&lt;/VersionNumber&gt;&lt;RequestType&gt;2&lt;/RequestType&gt;&lt;Info&gt;&lt;IID&gt;${iid}&lt;/IID&gt;&lt;/Info&gt;&lt;/ActivationRequest&gt;</RequestXml></request></BatchActivate></soap:Body></soap:Envelope>`;

    try {
        const response = await axios.post(directIpUrl, xml, {
            httpsAgent: agent,
            headers: {
                'Host': 'mobile.sls.microsoft.com', // TRÈS IMPORTANT : On dit au serveur qu'on veut parler à mobile.sls
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
            console.log("❌ Réponse reçue, mais pas de CID.");
            console.log("Détail : " + response.data.substring(0, 300));
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.log("❌ Microsoft bloque l'IP de GitHub au niveau du pare-feu.");
        } else {
            console.log("❌ Erreur : " + error.message);
        }
    }
}

getCID();
