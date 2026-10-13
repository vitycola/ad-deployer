/**
 * Insights por anuncio dentro de uno o varios conjuntos (incluye anuncios ya borrados
 * dentro del rango de fechas).
 *   npx ts-node src/ad_breakdown.ts <adset_id> [<adset_id> ...]
 */
import axios from 'axios';
import { ENV } from './config/env';

const BASE = 'https://graph.facebook.com/v20.0';
const token = ENV.META_ACCESS_TOKEN;

async function run() {
  const adsets = process.argv.slice(2);
  for (const adset of adsets) {
    const { data } = await axios.get(`${BASE}/${adset}/insights`, {
      params: {
        access_token: token,
        level: 'ad',
        date_preset: 'maximum',
        fields: 'ad_name,spend,reach,impressions,frequency,cpm,ctr,inline_link_clicks,video_thruplay_watched_actions,video_avg_time_watched_actions',
      },
    });
    console.log(`\n${'='.repeat(70)}\nConjunto ${adset}`);
    for (const r of data.data || []) {
      const thru = (r.video_thruplay_watched_actions || []).reduce((s: number, a: any) => s + Number(a.value), 0);
      const avg = (r.video_avg_time_watched_actions || []).reduce((s: number, a: any) => s + Number(a.value), 0);
      console.log(`\n  🔸 ${r.ad_name}`);
      console.log(`     gasto ${Number(r.spend).toFixed(2)}€ | alcance ${Number(r.reach).toLocaleString('es-ES')} | impr ${Number(r.impressions).toLocaleString('es-ES')} | frec ${Number(r.frequency).toFixed(2)}`);
      console.log(`     CPM ${Number(r.cpm).toFixed(2)}€ | CTR ${Number(r.ctr || 0).toFixed(2)}% | link clicks ${r.inline_link_clicks || 0}`);
      console.log(`     ThruPlays ${thru} | tiempo medio de visionado ${avg}s`);
    }
  }
}

run().catch((e) => {
  console.error('ERROR:', e.response?.data?.error?.message || e.message);
  process.exit(1);
});
