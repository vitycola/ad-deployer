/**
 * Crea SOLO los anuncios (strategy.ads) dentro de un AdSet ya existente.
 * Uso cuando deploy_fase2 creo campana + adset pero fallo al crear los anuncios.
 *
 *   npx ts-node src/deploy_ads_only.ts <adset_id> <ruta-al-strategy.json>
 */
import { readStrategyJson } from './utils/fileReader';
import { CreativeManager } from './services/deploy/CreativeManager';
import { AdDeployer } from './services/deploy/AdDeployer';

const PAGE_ID = '105090991864169';
const ADSET_ID = process.argv[2];
const STRATEGY_PATH = process.argv[3];

if (!ADSET_ID || !STRATEGY_PATH) {
  console.error("❌ Uso: npx ts-node src/deploy_ads_only.ts <adset_id> <ruta-al-strategy.json>");
  process.exit(1);
}

async function run() {
  const strategy = readStrategyJson(STRATEGY_PATH);
  const creativeManager = new CreativeManager();
  const adDeployer = new AdDeployer();
  const createdAds: { name: string; id: string }[] = [];

  console.log(`\n🔄 Creando anuncios en AdSet existente: ${ADSET_ID}\n`);

  for (const adData of strategy.ads) {
    console.log(`\nProcesando Anuncio: ${adData.name} (${adData.type})`);

    let mediaParams: any = {};
    if (adData.type === 'video') {
      mediaParams.videoId = await creativeManager.uploadVideo(adData.creative_path);
    } else if (adData.type === 'image') {
      mediaParams.imageHash = await creativeManager.uploadImage(adData.creative_path);
    }

    console.log("  ⏳ Esperando 15 segundos para procesado del creativo por Meta...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    const adId = await adDeployer.deploy(ADSET_ID, PAGE_ID, adData, mediaParams);
    createdAds.push({ name: adData.name, id: adId });
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅  ANUNCIOS CREADOS");
  console.log("═══════════════════════════════════════════");
  console.log(`  Ad Set   : ${ADSET_ID}`);
  for (const ad of createdAds) {
    console.log(`    - ${ad.name}: ${ad.id}`);
  }
  console.log(`  Estado   : ⏸️  PAUSADOS (actívalo manualmente en Ads Manager)`);
  console.log("═══════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("\n❌ Error fatal:", err.message || err);
  if (err.response?.data) {
    console.error("Detalle de Meta API:", JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
