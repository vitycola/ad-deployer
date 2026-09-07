import { readStrategyJson } from './utils/fileReader';
import { AdDeployer } from './services/deploy/AdDeployer';

const PAGE_ID = '105090991864169';
const ADSET_ID = '120246031013810598';
const VIDEO_ID = '2488268768260518';
const STRATEGY_PATH = 'data/strategy_granada_fase1_warm.json';

async function run() {
  const strategy = readStrategyJson(STRATEGY_PATH);
  
  console.log(`\n🔄 Creando anuncio para Granada Fase 1...`);
  console.log(`  Ad Set   : ${ADSET_ID}`);
  console.log(`  Video    : ${VIDEO_ID}\n`);

  const adDeployer = new AdDeployer();
  const adId = await adDeployer.deploy(ADSET_ID, PAGE_ID, strategy.ad, { videoId: VIDEO_ID });

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅  FASE 1 GRANADA — DESPLIEGUE COMPLETADO");
  console.log("═══════════════════════════════════════════");
  console.log(`  Campaña    : 120246030975630598`);
  console.log(`  Ad Set     : ${ADSET_ID}`);
  console.log(`  Video      : ${VIDEO_ID}`);
  console.log(`  Anuncio    : ${adId}`);
  console.log(`  Estado     : ⏸️  PAUSADO — Actívalo en Ads Manager`);
  console.log(`  Presupuesto: 2€/día | Programar: 13 mayo → 22 mayo`);
  console.log("═══════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
