/**
 * Análisis completo de todas las campañas de la cuenta (Los Jaleo).
 * Vuelca métricas históricas (date_preset: maximum) en JSON + tabla.
 */
import { account } from './core/metaClient';

const FIELDS_CAMPAIGN = ['id', 'name', 'status', 'objective', 'created_time', 'daily_budget', 'lifetime_budget'];
const FIELDS_INSIGHTS = [
  'spend', 'reach', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'frequency',
  'actions', 'cost_per_action_type', 'purchase_roas',
  'video_thruplay_watched_actions', 'video_p50_watched_actions', 'video_p100_watched_actions',
  'date_start', 'date_stop',
];

function act(actions: any[], type: string): number {
  if (!actions) return 0;
  const f = actions.find((a: any) => a.action_type === type);
  return f ? parseFloat(f.value) : 0;
}

async function run() {
  const campaigns = await account.getCampaigns(FIELDS_CAMPAIGN, { limit: 200 });
  const rows: any[] = [];

  for (const camp of campaigns) {
    let ins: any = null;
    try {
      const arr = await (camp as any).getInsights(FIELDS_INSIGHTS, {
        date_preset: 'maximum',
        level: 'campaign',
      });
      if (arr && arr.length > 0) ins = arr[0];
    } catch (e: any) {
      // sin datos
    }

    const purchases = ins ? act(ins.actions, 'purchase') + act(ins.actions, 'offsite_conversion.fb_pixel_purchase') : 0;
    const lpv = ins ? act(ins.actions, 'landing_page_view') : 0;
    const linkClicks = ins ? act(ins.actions, 'link_click') : 0;
    const thruPlays = ins ? act(ins.video_thruplay_watched_actions, 'video_view') : 0;
    const roasArr = ins?.purchase_roas || [];
    const roas = roasArr.length ? parseFloat(roasArr[0].value) : 0;

    rows.push({
      name: camp.name,
      status: camp.status,
      objective: camp.objective,
      created: camp.created_time,
      spend: ins ? parseFloat(ins.spend || '0') : 0,
      reach: ins ? parseInt(ins.reach || '0') : 0,
      impressions: ins ? parseInt(ins.impressions || '0') : 0,
      clicks: ins ? parseInt(ins.clicks || '0') : 0,
      ctr: ins ? parseFloat(ins.ctr || '0') : 0,
      cpc: ins ? parseFloat(ins.cpc || '0') : 0,
      cpm: ins ? parseFloat(ins.cpm || '0') : 0,
      frequency: ins ? parseFloat(ins.frequency || '0') : 0,
      linkClicks,
      lpv,
      thruPlays,
      purchases,
      roas,
      costPerPurchase: purchases > 0 && ins ? parseFloat(ins.spend) / purchases : 0,
      period: ins ? `${ins.date_start} -> ${ins.date_stop}` : '-',
    });
  }

  rows.sort((a, b) => b.spend - a.spend);
  console.log(JSON.stringify(rows, null, 2));

  const withData = rows.filter(r => r.spend > 0);
  const t = (k: string) => withData.reduce((s, r) => s + r[k], 0);
  console.log('\n===== TOTALES (con gasto) =====');
  console.log('Campañas con gasto :', withData.length, '/', rows.length);
  console.log('Gasto total        :', t('spend').toFixed(2), 'EUR');
  console.log('Alcance total      :', t('reach').toLocaleString('es-ES'));
  console.log('Impresiones        :', t('impressions').toLocaleString('es-ES'));
  console.log('Clics              :', t('clicks').toLocaleString('es-ES'));
  console.log('Link clicks        :', t('linkClicks').toLocaleString('es-ES'));
  console.log('Landing page views :', t('lpv').toLocaleString('es-ES'));
  console.log('ThruPlays          :', t('thruPlays').toLocaleString('es-ES'));
  console.log('Compras            :', t('purchases'));
  console.log('CTR medio ponderado:', t('impressions') > 0 ? ((t('clicks') / t('impressions')) * 100).toFixed(2) : 'N/A', '%');
  console.log('CPC medio          :', t('clicks') > 0 ? (t('spend') / t('clicks')).toFixed(2) : 'N/A', 'EUR');
  console.log('CPM medio          :', t('impressions') > 0 ? ((t('spend') / t('impressions')) * 1000).toFixed(2) : 'N/A', 'EUR');
}

run().catch(err => { console.error('ERROR:', err.message || err); process.exit(1); });
