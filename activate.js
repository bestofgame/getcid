const axios = require('axios');
const https = require('https');

// Agent pour ignorer les erreurs SSL de GitHub
const agent = new https.Agent({ rejectUnauthorized: false });

async function getCID() {
    const iid = process.argv[2] ? process.argv[2].replace(/\D/g, '') : '';
    if (iid.length < 54) {
        console.log("❌ IID trop court.");
        return;
    }

    console.log("🚀 Initialisation de la session GoInteract...");

    try {
        // ÉTAPE 1 : On récupère une session fraîche (comme dans le fichier config que tu m'as montré)
        // On utilise l'URL de base pour obtenir un jeton de session
        const initUrl = "https://microsoft.gointeract.io/interact/index?interaction=1461173234028-3884f8602eccbe259104553afa8415434b4581-05d1&accountId=microsoft&appkey=196de13c-e946-4531-98f6-2719ec8405ce";

        const session = await axios.get(initUrl, { 
            httpsAgent: agent,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        console.log("✅ Session établie. Envoi de l'IID à l'API d'activation...");

        // ÉTAPE 2 : On utilise l'URL SOAP mais sur le domaine mobile qui est plus souple
        const soapUrl = "https://mobile.sls.microsoft.com/sls/ws/ActivationService.asmx";
        
        const xml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><BatchActivate xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"><request><Digest>None</Digest><RequestXml>&lt;ActivationRequest xmlns="http://www.microsoft.com/DRM/SL/BatchActivation/1.0"&gt;&lt;VersionNumber&gt;3.2&lt;/VersionNumber&gt;&lt;RequestType&gt;2&lt;/RequestType&gt;&lt;Info&gt;&lt;IID&gt;${iid}&lt;/IID&gt;&lt;/Info&gt;&lt;/ActivationRequest&gt;</RequestXml></request></BatchActivate></soap:Body></soap:Envelope>`;

        const response = await axios.post(soapUrl, xml, {
            httpsAgent: agent,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': '"http://www.microsoft.com/DRM/SL/BatchActivation/1.0/BatchActivate"',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            }
        });

        const match = response.data.match(/&lt;CID&gt;(\d+)&lt;\/CID&gt;/);
        
        if (match) {
            console.log("\n========================================");
            console.log("🎯 CONFIRMATION ID (CID) : " + match[1]);
            console.log("========================================\n");
        } else {
            console.log("❌ Erreur : Microsoft a refusé l'IID.");
            if (response.data.includes("Exceeded")) console.log("⚠️ Raison : IID expiré ou trop utilisé.");
        }

    } catch (error) {
        console.log("❌ Erreur Fatale : " + error.message);
        if (error.response) console.log("Code Statut : " + error.response.status);
    }
}

getCID();
