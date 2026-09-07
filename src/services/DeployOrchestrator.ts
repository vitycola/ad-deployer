import { account } from '../core/metaClient';
import { readStrategyJson } from '../utils/fileReader';
import { CampaignDeployer } from './deploy/CampaignDeployer';
import { AdSetDeployer } from './deploy/AdSetDeployer';
import { CreativeManager } from './deploy/CreativeManager';
import { AdDeployer } from './deploy/AdDeployer';

const PAGE_ID = '105090991864169';

export class DeployOrchestrator {
  private campaignDeployer = new CampaignDeployer();
  private adSetDeployer = new AdSetDeployer();
  private creativeManager = new CreativeManager();
  private adDeployer = new AdDeployer();

  public async deploy(strategyPath: string): Promise<void> {
    console.log(`\n🚀 Leyendo estrategia desde: ${strategyPath}\n`);
    const strategy = readStrategyJson(strategyPath);

    // 1. Crear la campaña
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  PASO 1/4: Creando Campaña");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const campaignId = await this.campaignDeployer.deploy(strategy.campaign);

    // 2. Subir el creativo (video)
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  PASO 2/4: Subiendo Video");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const videoId = await this.creativeManager.uploadVideo(strategy.ad.creative_video_path);

    // 3. Crear el conjunto de anuncios
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  PASO 3/4: Creando Conjunto de Anuncios");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const adSetId = await this.adSetDeployer.deploy(campaignId, strategy.adSet);

    // 4. Crear el anuncio con el creativo
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  PASO 4/4: Creando Anuncio");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const adId = await this.adDeployer.deploy(adSetId, PAGE_ID, strategy.ad, { videoId });

    // Resumen final
    console.log("\n═══════════════════════════════════════════");
    console.log("  ✅  DESPLIEGUE COMPLETADO");
    console.log("═══════════════════════════════════════════");
    console.log(`  Campaña    : ${strategy.campaign.name} (ID: ${campaignId})`);
    console.log(`  Ad Set     : ${strategy.adSet.name} (ID: ${adSetId})`);
    console.log(`  Video      : ID ${videoId}`);
    console.log(`  Anuncio    : ID ${adId}`);
    console.log(`  Estado     : ⏸️  PAUSADO (actívalo manualmente en Ads Manager)`);
    console.log("═══════════════════════════════════════════\n");
  }
}
