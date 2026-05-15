const axios = require('axios');
const https = require('https');

// Simulation de l'API : prend l'IID en argument
async function runActivation() {
    const iid = process.argv[2] ? process.argv[2].replace(/\D/g, '') : '';

    if (!iid || iid.length < 54) {
        console.log(JSON.stringify({ success: false, message: "IID invalide ou vide." }));
        return;
    }

    const url = "https://activation.sls.microsoft.com/sls/ws/ActivationService.asmx";
    
    // Construction du XML identique à ton PHP
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
            <BatchActivate xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0">
                <request>
                    <Digest>None</Digest>
                    <RequestXml>&lt;ActivationRequest xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"&gt;&lt;VersionNumber&gt;3.2&lt;/VersionNumber&gt;&lt;RequestType&gt;2&lt;/RequestType&gt;&lt;Info&gt;&lt;IID&gt;${iid}&lt;/IID&gt;&lt;/Info&gt;&lt;/ActivationRequest&gt;</RequestXml>
                </request>
            </BatchActivate>
        </soap:Body>
    </soap:Envelope>`;

    try {
        const response = await axios.post(url, xml, {
    headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://www.microsoft.com/DRM/SL/BatchActivation/1.0/BatchActivate"',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    },
    // FORCE la connexion même si le certificat est "inconnu"
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false 
    })
});
        // Recherche du CID dans la réponse
        const match = response.data.match(/&lt;CID&gt;(\d+)&lt;\/CID&gt;/);
        
        if (match) {
            console.log("-----------------------------------------");
            console.log("✅ SUCCÈS ! TON CID EST :");
            console.log(match[1]);
            console.log("-----------------------------------------");
        } else {
            console.log("❌ Erreur : Microsoft a répondu mais n'a pas donné de CID.");
            console.log("Détail : " + response.data.substring(0, 200));
        }
    } catch (error) {
        console.log("❌ Erreur de connexion : " + error.message);
    }
}

runActivation();
