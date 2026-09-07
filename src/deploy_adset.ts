import { readStrategyJson } from './utils/fileReader';
import { AdSetDeployer } from './services/deploy/AdSetDeployer';

const CAMPAIGN_ID = '120246032225560598';
const STRATEGY_PATH = 'data/strategy_granada_fase2_ventas.json';

async function run() {
  const strategy = readStrategyJson(STRATEGY_PATH);
  
  console.log(`\n🔄 Recreando AdSet para Granada Fase 2...`);

  const adSetDeployer = new AdSetDeployer();
  const adSetId = await adSetDeployer.deploy(CAMPAIGN_ID, strategy.adSet);

  console.log(`✅ AdSet creado: ${adSetId}`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
