import { readStrategyJson } from './utils/fileReader';
import { AdSetDeployer } from './services/deploy/AdSetDeployer';
import { CreativeManager } from './services/deploy/CreativeManager';
import { AdDeployer } from './services/deploy/AdDeployer';

const PAGE_ID = '105090991864169';
const EXISTING_CAMPAIGN_ID = process.argv[2];
const STRATEGY_PATH = process.argv[3];

if (!EXISTING_CAMPAIGN_ID || !STRATEGY_PATH) {
  console.error("❌ Uso: npx ts-node src/deploy_resume.ts <campaign_id> <ruta-al-strategy.json>");
  process.exit(1);
}

async function run() {
  const strategy = readStrategyJson(STRATEGY_PATH);
  
  console.log(`\n🔄 Reanudando despliegue en campaña existente: ${EXISTING_CAMPAIGN_ID}\n`);

  // PASO 2: Subir video (chunked)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASO 2/4: Subiendo Video (chunked upload)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const creativeManager = new CreativeManager();
  const videoId = await creativeManager.uploadVideo(strategy.ad.creative_video_path);

  // PASO 3: Crear Ad Set
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASO 3/4: Creando Conjunto de Anuncios");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const adSetDeployer = new AdSetDeployer();
  const adSetId = await adSetDeployer.deploy(EXISTING_CAMPAIGN_ID, strategy.adSet);

  // PASO 4: Crear Anuncio
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASO 4/4: Creando Anuncio");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const adDeployer = new AdDeployer();
  const adId = await adDeployer.deploy(adSetId, PAGE_ID, strategy.ad, videoId);

  // Resumen
  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅  DESPLIEGUE COMPLETADO");
  console.log("═══════════════════════════════════════════");
  console.log(`  Campaña    : ${EXISTING_CAMPAIGN_ID}`);
  console.log(`  Ad Set     : ${adSetId}`);
  console.log(`  Video      : ${videoId}`);
  console.log(`  Anuncio    : ${adId}`);
  console.log(`  Estado     : ⏸️  PAUSADO (actívalo manualmente en Ads Manager)`);
  console.log("═══════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("❌ Error fatal:", err.message || err);
  process.exit(1);
});
