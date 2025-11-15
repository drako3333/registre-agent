const si = require('systeminformation');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  const rawConfig = fs.readFileSync(configPath);
  config = JSON.parse(rawConfig);
} catch (e) {
  console.error('Erreur: Impossible de lire le fichier config.json.', e);
  console.error('Veuillez exécuter "bash install.sh" pour configurer l\'agent.');
  process.exit(1);
}

const { COLLECTOR_URL, SERVER_ID, API_KEY } = config;

if (!COLLECTOR_URL || !SERVER_ID || !API_KEY) {
  console.error('Erreur: config.json est incomplet. Relancez "bash install.sh".');
  process.exit(1);
}

const POST_URL = `${COLLECTOR_URL}/${SERVER_ID}`;
const COLLECTION_INTERVAL_MS = 10000; // 10 secondes

// --- Logique de collecte ---
async function collectAndSendMetrics() {
  console.log(`[${new Date().toISOString()}] Collecte des métriques...`);

  try {
    const [cpuData, memData, fsData, netData] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats('default')
    ]);

    // --- BLOC CORRIGÉ ---
    // Ajout de vérifications pour les valeurs null ou undefined avant .toFixed()

    const mainFs = fsData[0] || { use: 0 };
    const mainNet = netData[0] || { rx_sec: 0, tx_sec: 0 }; // Sécurité si netData[0] est undefined

    const payload = {
      // Si cpuData.currentLoad est null ou undefined, utilise 0
      cpu_load: parseFloat((cpuData.currentLoad || 0).toFixed(2)),
      
      // Si memData.total est 0, évite la division par zéro (NaN)
      ram_usage_percent: parseFloat((memData.total > 0 ? (memData.used / memData.total) * 100 : 0).toFixed(2)),
      
      // Déjà sécurisé par `mainFs`
      disk_usage_percent: parseFloat(mainFs.use.toFixed(2)),
      
      // Sécurisé par `mainNet`
      network_rx_sec: parseFloat((mainNet.rx_sec || 0).toFixed(2)),
      network_tx_sec: parseFloat((mainNet.tx_sec || 0).toFixed(2))
    };
    // --- FIN DU BLOC CORRIGÉ ---

    console.log(`[${new Date().toISOString()}] Envoi vers ${POST_URL}`);

    const response = await fetch(POST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    console.log(`[${new Date().toISOString()}] Données envoyées.`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur:`, error.message);
  }
}

// --- Démarrage de l'agent ---
console.log('Agent de monitoring Registre démarré.');
console.log(`Envoi des données toutes les ${COLLECTION_INTERVAL_MS / 1000} secondes.`);
collectAndSendMetrics();
setInterval(collectAndSendMetrics, COLLECTION_INTERVAL_MS);
