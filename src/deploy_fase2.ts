import { readStrategyJson } from './utils/fileReader';
import { CampaignDeployer } from './services/deploy/CampaignDeployer';
import { AdSetDeployer } from './services/deploy/AdSetDeployer';
import { CreativeManager } from './services/deploy/CreativeManager';
import { AdDeployer } from './services/deploy/AdDeployer';

const PAGE_ID = '105090991864169';

async function run() {
  const strategyPath = process.argv[2] || 'data/strategy_orihuela_fase2_ventas.json';
  console.log(`\n🚀 Leyendo estrategia desde: ${strategyPath}\n`);
  
  const strategy = readStrategyJson(strategyPath);

  const campaignDeployer = new CampaignDeployer();
  const adSetDeployer = new AdSetDeployer();
  const creativeManager = new CreativeManager();
  const adDeployer = new AdDeployer();

  // 1. Crear Campaña
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASO 1/4: Creando Campaña (Fase 2)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const campaignId = await campaignDeployer.deploy(strategy.campaign);

  // 2. Crear Ad Set
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASO 2/4: Creando Conjunto de Anuncios");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  // OJO: Aquí el adSet.targeting en Fase 2 idealmente incluye el retargeting.
  // El usuario dijo que lo haría a mano, pero creamos la base
  const adSetId = await adSetDeployer.deploy(campaignId, strategy.adSet);

  // 3 & 4. Subir Creativos y Crear Anuncios
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PASO 3 & 4: Subiendo Creativos y Creando Anuncios");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const createdAds = [];

  for (const adData of strategy.ads) {
    console.log(`\nProcesando Anuncio: ${adData.name} (${adData.type})`);
    
    let mediaParams: any = {};
    
    if (adData.type === 'video') {
      const videoId = await creativeManager.uploadVideo(adData.creative_path);
      mediaParams.videoId = videoId;
    } else if (adData.type === 'image') {
      const imageHash = await creativeManager.uploadImage(adData.creative_path);
      mediaParams.imageHash = imageHash;
    }

    // Esperar unos segundos antes de crear el anuncio (especialmente útil para vídeos para que generen miniatura)
    console.log("  ⏳ Esperando 10 segundos para procesado del creativo por Meta...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    const adId = await adDeployer.deploy(adSetId, PAGE_ID, adData, mediaParams);
    createdAds.push({ name: adData.name, id: adId });
  }

  // Resumen final
  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅  DESPLIEGUE FASE 2 COMPLETADO");
  console.log("═══════════════════════════════════════════");
  console.log(`  Campaña    : ${campaignId}`);
  console.log(`  Ad Set     : ${adSetId}`);
  console.log(`  Anuncios   :`);
  for (const ad of createdAds) {
    console.log(`    - ${ad.name}: ${ad.id}`);
  }
  console.log(`  Estado     : ⏸️  PAUSADOS (Modifica tu público de retargeting en Ads Manager y actívala)`);
  console.log("═══════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("\n❌ Error fatal:", err.message || err);
  if (err.response?.data) {
    console.error("Detalle de Meta API:", JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
