/**
 * Script de análisis comparativo: Orihuela vs Camping Osuna
 * Extrae métricas detalladas incluyendo video views, conversiones y coste por resultado.
 */
import { account } from './core/metaClient';

const FIELDS_CAMPAIGN = ['id', 'name', 'status', 'objective', 'daily_budget', 'lifetime_budget'];
const FIELDS_INSIGHTS = [
  'spend', 'reach', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'frequency',
  'actions', 'cost_per_action_type', 'video_avg_time_watched_actions',
  'video_p25_watched_actions', 'video_p50_watched_actions', 'video_p75_watched_actions', 'video_p100_watched_actions',
  'video_thruplay_watched_actions',
  'date_start', 'date_stop'
];

interface ParsedCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  date_start: string;
  date_stop: string;
  // Video metrics
  thruPlays: number;
  costPerThruPlay: number;
  videoP50: number;
  videoP75: number;
  videoP100: number;
  // Conversion metrics
  purchases: number;
  costPerPurchase: number;
  linkClicks: number;
  costPerLinkClick: number;
  landingPageViews: number;
  // All actions raw
  allActions: any[];
}

function extractAction(actions: any[], type: string): number {
  if (!actions) return 0;
  const found = actions.find((a: any) => a.action_type === type);
  return found ? parseInt(found.value) : 0;
}

function extractCostPerAction(costActions: any[], type: string): number {
  if (!costActions) return 0;
  const found = costActions.find((a: any) => a.action_type === type);
  return found ? parseFloat(found.value) : 0;
}

async function fetchCampaignData(keyword: string): Promise<ParsedCampaign[]> {
  const campaigns = await account.getCampaigns(FIELDS_CAMPAIGN, { limit: 100 });
  const results: ParsedCampaign[] = [];

  for (const camp of campaigns) {
    if (!camp.name.toLowerCase().includes(keyword.toLowerCase())) continue;

    try {
      const insights = await (camp as any).getInsights(FIELDS_INSIGHTS, {
        date_preset: 'maximum',
        level: 'campaign'
      });

      if (insights && insights.length > 0) {
        const ins = insights[0];
        results.push({
          id: camp.id,
          name: camp.name,
          status: camp.status,
          objective: camp.objective,
          spend: parseFloat(ins.spend || '0'),
          reach: parseInt(ins.reach || '0'),
          impressions: parseInt(ins.impressions || '0'),
          clicks: parseInt(ins.clicks || '0'),
          ctr: parseFloat(ins.ctr || '0'),
          cpc: parseFloat(ins.cpc || '0'),
          cpm: parseFloat(ins.cpm || '0'),
          frequency: parseFloat(ins.frequency || '0'),
          date_start: ins.date_start,
          date_stop: ins.date_stop,
          // Video
          thruPlays: extractAction(ins.video_thruplay_watched_actions, 'video_view'),
          costPerThruPlay: ins.spend && extractAction(ins.video_thruplay_watched_actions, 'video_view')
            ? parseFloat(ins.spend) / extractAction(ins.video_thruplay_watched_actions, 'video_view')
            : 0,
          videoP50: extractAction(ins.video_p50_watched_actions, 'video_view'),
          videoP75: extractAction(ins.video_p75_watched_actions, 'video_view'),
          videoP100: extractAction(ins.video_p100_watched_actions, 'video_view'),
          // Conversions
          purchases: extractAction(ins.actions, 'purchase') + extractAction(ins.actions, 'offsite_conversion.fb_pixel_purchase'),
          costPerPurchase: extractCostPerAction(ins.cost_per_action_type, 'purchase') || extractCostPerAction(ins.cost_per_action_type, 'offsite_conversion.fb_pixel_purchase'),
          linkClicks: extractAction(ins.actions, 'link_click'),
          costPerLinkClick: extractCostPerAction(ins.cost_per_action_type, 'link_click'),
          landingPageViews: extractAction(ins.actions, 'landing_page_view'),
          allActions: ins.actions || []
        });
      }
    } catch (e) {
      // Skip campaigns without data
    }
  }
  return results;
}

function printCampaignBlock(label: string, campaigns: ParsedCampaign[]) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  📊  ${label}`);
  console.log(`${'═'.repeat(70)}`);

  if (campaigns.length === 0) {
    console.log("  ⚠️  No se encontraron campañas con ese filtro.\n");
    return;
  }

  let totalSpend = 0, totalReach = 0, totalClicks = 0, totalThruPlays = 0;
  let totalLinkClicks = 0, totalPurchases = 0, totalLPV = 0;

  campaigns.forEach((c, i) => {
    totalSpend += c.spend;
    totalReach += c.reach;
    totalClicks += c.clicks;
    totalThruPlays += c.thruPlays;
    totalLinkClicks += c.linkClicks;
    totalPurchases += c.purchases;
    totalLPV += c.landingPageViews;

    const statusIcon = c.status === 'ACTIVE' ? '🟢' : '⏸️';
    console.log(`\n  ${statusIcon} ${c.name}`);
    console.log(`     Objetivo  : ${c.objective} | Período: ${c.date_start} → ${c.date_stop}`);
    console.log(`     Gasto     : ${c.spend.toFixed(2)}€ | Alcance: ${c.reach.toLocaleString('es-ES')} | Impresiones: ${c.impressions.toLocaleString('es-ES')}`);
    console.log(`     CTR       : ${c.ctr.toFixed(2)}% | CPC: ${c.cpc > 0 ? c.cpc.toFixed(2) + '€' : 'N/A'} | CPM: ${c.cpm.toFixed(2)}€ | Frec: ${c.frequency.toFixed(1)}x`);

    if (c.thruPlays > 0) {
      console.log(`     🎥 Vídeo  : ${c.thruPlays.toLocaleString('es-ES')} ThruPlays | Coste/ThruPlay: ${c.costPerThruPlay.toFixed(3)}€`);
      console.log(`                 P50: ${c.videoP50.toLocaleString('es-ES')} | P75: ${c.videoP75.toLocaleString('es-ES')} | P100: ${c.videoP100.toLocaleString('es-ES')}`);
      if (c.reach > 0 && c.videoP50 > 0) {
        console.log(`                 Retención al 50%: ${((c.videoP50 / c.reach) * 100).toFixed(1)}% del alcance`);
      }
    }

    if (c.linkClicks > 0) {
      console.log(`     🔗 Link   : ${c.linkClicks} clics al enlace | Coste/clic: ${c.costPerLinkClick > 0 ? c.costPerLinkClick.toFixed(2) + '€' : 'N/A'}`);
    }
    if (c.landingPageViews > 0) {
      console.log(`     🌐 Landing: ${c.landingPageViews} visitas a la web`);
    }
    if (c.purchases > 0) {
      console.log(`     🎟️  Compras: ${c.purchases} | Coste/compra: ${c.costPerPurchase.toFixed(2)}€`);
    }

    // Show all tracked actions for debugging/completeness
    if (c.allActions.length > 0) {
      const relevant = c.allActions.filter((a: any) =>
        !['impression', 'reach'].includes(a.action_type)
      );
      if (relevant.length > 0) {
        console.log(`     📋 Acciones registradas:`);
        relevant.forEach((a: any) => {
          console.log(`        - ${a.action_type}: ${a.value}`);
        });
      }
    }
  });

  // Totals
  console.log(`\n  ${'─'.repeat(66)}`);
  console.log(`  📌 TOTALES (${campaigns.length} campañas):`);
  console.log(`     Gasto total       : ${totalSpend.toFixed(2)}€`);
  console.log(`     Alcance total     : ${totalReach.toLocaleString('es-ES')} personas`);
  console.log(`     Clics totales     : ${totalClicks.toLocaleString('es-ES')}`);
  if (totalThruPlays > 0) console.log(`     ThruPlays totales : ${totalThruPlays.toLocaleString('es-ES')} | Media: ${(totalSpend / totalThruPlays).toFixed(3)}€/ThruPlay`);
  if (totalLinkClicks > 0) console.log(`     Link Clicks total : ${totalLinkClicks} | Media: ${(totalSpend / totalLinkClicks).toFixed(2)}€/clic`);
  if (totalLPV > 0) console.log(`     Landing Views     : ${totalLPV}`);
  if (totalPurchases > 0) console.log(`     🎟️ Compras total  : ${totalPurchases} | ROAS: ${totalPurchases > 0 ? (totalSpend / totalPurchases).toFixed(2) + '€/compra' : 'N/A'}`);
}

async function run() {
  console.log("\n🔍 Extrayendo datos de campañas de Meta Ads...\n");

  // Fetch both campaign groups
  const orihuela = await fetchCampaignData('orihuela');
  const osuna = await fetchCampaignData('osuna');
  // Also try "camping" and "gramola" for wider coverage
  const gramola = await fetchCampaignData('gramola');
  const camping = await fetchCampaignData('camping');

  // Merge and deduplicate
  const orihuelaAll = [...orihuela, ...gramola].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  const osunaAll = [...osuna, ...camping].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);

  printCampaignBlock("CAMPAÑAS ORIHUELA (La Gramola Rock Bar)", orihuelaAll);
  printCampaignBlock("CAMPAÑAS CAMPING OSUNA (Madrid)", osunaAll);

  // Comparative summary
  if (orihuelaAll.length > 0 && osunaAll.length > 0) {
    const oSpend = orihuelaAll.reduce((s, c) => s + c.spend, 0);
    const oReach = orihuelaAll.reduce((s, c) => s + c.reach, 0);
    const oThru = orihuelaAll.reduce((s, c) => s + c.thruPlays, 0);
    const oLinks = orihuelaAll.reduce((s, c) => s + c.linkClicks, 0);
    const oPurch = orihuelaAll.reduce((s, c) => s + c.purchases, 0);

    const cSpend = osunaAll.reduce((s, c) => s + c.spend, 0);
    const cReach = osunaAll.reduce((s, c) => s + c.reach, 0);
    const cThru = osunaAll.reduce((s, c) => s + c.thruPlays, 0);
    const cLinks = osunaAll.reduce((s, c) => s + c.linkClicks, 0);
    const cPurch = osunaAll.reduce((s, c) => s + c.purchases, 0);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  ⚖️   COMPARATIVA: ORIHUELA vs CAMPING OSUNA`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`  ${''.padEnd(25)} | ${'ORIHUELA'.padStart(15)} | ${'OSUNA'.padStart(15)}`);
    console.log(`  ${'─'.repeat(25)}-+-${'─'.repeat(15)}-+-${'─'.repeat(15)}`);
    console.log(`  ${'Gasto total'.padEnd(25)} | ${(oSpend.toFixed(2) + '€').padStart(15)} | ${(cSpend.toFixed(2) + '€').padStart(15)}`);
    console.log(`  ${'Alcance'.padEnd(25)} | ${oReach.toLocaleString('es-ES').padStart(15)} | ${cReach.toLocaleString('es-ES').padStart(15)}`);
    console.log(`  ${'CPM (€/1K imp.)'.padEnd(25)} | ${(oReach > 0 ? ((oSpend / oReach) * 1000).toFixed(2) + '€' : 'N/A').padStart(15)} | ${(cReach > 0 ? ((cSpend / cReach) * 1000).toFixed(2) + '€' : 'N/A').padStart(15)}`);
    if (oThru > 0 || cThru > 0) {
      console.log(`  ${'ThruPlays'.padEnd(25)} | ${oThru.toLocaleString('es-ES').padStart(15)} | ${cThru.toLocaleString('es-ES').padStart(15)}`);
      console.log(`  ${'€/ThruPlay'.padEnd(25)} | ${(oThru > 0 ? (oSpend / oThru).toFixed(3) + '€' : 'N/A').padStart(15)} | ${(cThru > 0 ? (cSpend / cThru).toFixed(3) + '€' : 'N/A').padStart(15)}`);
    }
    if (oLinks > 0 || cLinks > 0) {
      console.log(`  ${'Link Clicks'.padEnd(25)} | ${oLinks.toString().padStart(15)} | ${cLinks.toString().padStart(15)}`);
      console.log(`  ${'€/Link Click'.padEnd(25)} | ${(oLinks > 0 ? (oSpend / oLinks).toFixed(2) + '€' : 'N/A').padStart(15)} | ${(cLinks > 0 ? (cSpend / cLinks).toFixed(2) + '€' : 'N/A').padStart(15)}`);
    }
    if (oPurch > 0 || cPurch > 0) {
      console.log(`  ${'🎟️ Compras'.padEnd(25)} | ${oPurch.toString().padStart(15)} | ${cPurch.toString().padStart(15)}`);
      console.log(`  ${'€/Compra'.padEnd(25)} | ${(oPurch > 0 ? (oSpend / oPurch).toFixed(2) + '€' : 'N/A').padStart(15)} | ${(cPurch > 0 ? (cSpend / cPurch).toFixed(2) + '€' : 'N/A').padStart(15)}`);
    }
  }

  console.log(`\n${'═'.repeat(70)}\n`);
}

run().catch(err => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
