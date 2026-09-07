import { DeployOrchestrator } from './services/DeployOrchestrator';

const strategyPath = process.argv[2];

if (!strategyPath) {
  console.error("❌ Uso: npx ts-node src/deploy.ts <ruta-al-strategy.json>");
  process.exit(1);
}

async function run() {
  const orchestrator = new DeployOrchestrator();
  await orchestrator.deploy(strategyPath);
}

run().catch((err) => {
  console.error("❌ Error fatal durante el despliegue:", err.message || err);
  process.exit(1);
});
