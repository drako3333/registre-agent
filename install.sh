#!/bin/bash
echo "--- Configuration de l'agent de monitoring Registre ---"
echo ""

# 1. Vérifier Node.js et npm
if ! command -v node &> /dev/null
then
    echo "Erreur: Node.js n'est pas installé. Veuillez l'installer (node -v) et réessayer."
    exit 1
fi
if ! command -v npm &> /dev/null
then
    echo "Erreur: npm n'est pas installé. Veuillez l'installer et réessayer."
    exit 1
fi

# 2. Installer les dépendances depuis package.json
echo "Installation des dépendances (systeminformation, node-fetch)..."
npm install
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'installation des dépendances npm."
    exit 1
fi

# 3. Demander les informations
echo ""
echo "Veuillez copier/coller les informations depuis votre interface Registre Page."
read -p "Entrez votre SERVER_ID: " SERVER_ID
read -sp "Entrez votre API_KEY (sera masquée): " API_KEY
echo ""

# 4. Créer le fichier config.json
echo "Création du fichier config.json..."
cat > config.json << EOL
{
  "COLLECTOR_URL": "https://registreback.ustrohosting.ca/api/metrics/ingest",
  "SERVER_ID": "$SERVER_ID",
  "API_KEY": "$API_KEY"
}
EOL

# 5. Instructions finales
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "Pour lancer l'agent une seule fois (pour tester) :"
echo "   node agent.js"
echo ""
echo "Pour lancer l'agent en production (recommandé) :"
echo "   1. Installez PM2: npm install -g pm2"
echo "   2. Lancez l'agent: pm2 start agent.js --name registre-agent"
echo "   3. (Optionnel) Sauvegardez pour redémarrage auto: pm2 save"
echo ""
