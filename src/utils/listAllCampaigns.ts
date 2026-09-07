import { account } from '../core/metaClient';

// Script de diagnóstico: lista TODOS los nombres de campañas
async function listAllCampaigns() {
  console.log("\n📋 Listado completo de todas las campañas en tu cuenta:\n");
  const campaigns = await account.getCampaigns(
    ['id', 'name', 'status', 'objective', 'created_time'],
    { limit: 100 }
  );

  campaigns.forEach((c: any, i: number) => {
    const status = c.status === 'ACTIVE' ? '🟢' : '⏸️ ';
    console.log(`  ${String(i + 1).padStart(2)}. ${status} [${c.objective}] ${c.name}`);
  });

  console.log(`\n  Total: ${campaigns.length} campañas`);
}

listAllCampaigns().catch(console.error);
