const axios = require('axios');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function getCID() {
    const iid = process.argv[2] ? process.argv[2].replace(/\D/g, '') : '';
    if (iid.length < 54) {
        console.log("❌ IID trop court.");
        return;
    }

    // URL Mobile de secours (utilisée par les outils pro quand GoInteract est instable)
    const url = "https://mobile.sls.microsoft.com/sls/ws/ActivationService.asmx";
    
    console.log("🚀 Tentative d'activation via Mobile SLS...");

    const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><BatchActivate xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"><request><Digest>None</Digest><RequestXml>&lt;ActivationRequest xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"&gt;&lt;VersionNumber&gt;3.2&lt;/VersionNumber&gt;&lt;RequestType&gt;2&lt;/RequestType&gt;&lt;Info&gt;&lt;IID&gt;${iid}&lt;/IID&gt;&lt;/Info&gt;&lt;/ActivationRequest&gt;</RequestXml></request></BatchActivate></soap:Body></soap:Envelope>`;

    try {
        const response = await axios.post(url, xml, {
            httpsAgent: agent,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '"http://www.microsoft.com/DRM/SL/BatchActivation/1.0/BatchActivate"',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
                'Accept': '*/*',
                'Cache-Control': 'no-cache'
            }
        });

        const match = response.data.match(/&lt;CID&gt;(\d+)&lt;\/CID&gt;/);
        
        if (match) {
            console.log("\n========================================");
            console.log("🎯 CONFIRMATION ID (CID) : " + match[1]);
            console.log("========================================\n");
        } else {
            console.log("❌ Microsoft a répondu mais n'a pas généré de CID.");
            // Analyse de la réponse pour aider Khalid
            if (response.data.includes("0x8004C017")) console.log("Raison : IID invalide (Clé bloquée)");
            else if (response.data.includes("Exceeded")) console.log("Raison : Nombre d'activations dépassé.");
            else console.log("Détail technique : " + response.data.substring(0, 500));
        }

    } catch (error) {
        console.log("❌ Erreur de connexion : " + error.message);
        if (error.response) {
            console.log("Status : " + error.response.status);
            console.log("Data : " + error.response.data);
        }
    }
}

getCID();
