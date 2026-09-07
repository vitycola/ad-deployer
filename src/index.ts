import * as readline from 'readline';
import { CampaignAnalyzer } from './services/analyze/CampaignAnalyzer';
import { DeployOrchestrator } from './services/DeployOrchestrator';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  console.log("=========================================");
  console.log("   Meta Ads Deployer & Analyzer CLI");
  console.log("=========================================\n");
  
  const choice = await ask('¿Qué deseas hacer?\n1. Desplegar nueva campaña\n2. Analizar campañas anteriores\nElige una opción (1 o 2): ');
  
  switch(choice) {
    case '1': {
      const strategyPath = await ask('\n📄 Ruta al archivo strategy.json: ');
      console.log('\n🚀 Iniciando despliegue...');
      const orchestrator = new DeployOrchestrator();
      await orchestrator.deploy(strategyPath);
      break;
    }
    case '2': {
      console.log('\nHas elegido Analizar campañas anteriores.');
      const analyzer = new CampaignAnalyzer();
      await analyzer.analyze();
      break;
    }
    default:
      console.log('\nOpción no válida. Saliendo...');
  }
  rl.close();
}

main().catch(console.error);
