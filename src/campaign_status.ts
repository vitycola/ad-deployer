/**
 * Estado + insights + texto de creatividades de campañas concretas.
 *   npx ts-node src/campaign_status.ts <campaign_id> [<campaign_id> ...]
 */
import axios from 'axios';
import { ENV } from './config/env';

const BASE = 'https://graph.facebook.com/v20.0';
const token = ENV.META_ACCESS_TOKEN;

async function g(path: string, params: Record<string, string> = {}) {
  const res = await axios.get(`${BASE}/${path}`, { params: { access_token: token, ...params } });
  return res.data;
}

async function run() {
  const ids = process.argv.slice(2);
  for (const cid of ids) {
    const c = await g(cid, { fields: 'name,effective_status,daily_budget,start_time,stop_time' });
    console.log(`\n${'='.repeat(70)}\n📣 ${c.name}\n   id ${cid} | estado ${c.effective_status} | ${(Number(c.daily_budget) / 100).toFixed(2)}€/día`);
    console.log(`   ${c.start_time} → ${c.stop_time || '(sin fin)'}`);

    const ins = await g(`${cid}/insights`, {
      date_preset: 'maximum',
      fields: 'spend,reach,impressions,frequency,cpm,ctr,clicks,inline_link_clicks,video_thruplay_watched_actions,date_start,date_stop',
    });
    if (ins.data && ins.data.length) {
      const i = ins.data[0];
      const thru = (i.video_thruplay_watched_actions || []).reduce((s: number, a: any) => s + Number(a.value), 0);
      console.log(`   📊 gasto ${Number(i.spend).toFixed(2)}€ | alcance ${Number(i.reach).toLocaleString('es-ES')} | impr ${Number(i.impressions).toLocaleString('es-ES')} | frec ${Number(i.frequency).toFixed(2)}`);
      console.log(`      CPM ${Number(i.cpm).toFixed(2)}€ | CTR ${Number(i.ctr).toFixed(2)}% | clicks ${i.clicks} | link clicks ${i.inline_link_clicks || 0} | ThruPlays ${thru}`);
      console.log(`      periodo con datos: ${i.date_start} → ${i.date_stop}`);
    } else {
      console.log(`   📊 sin datos de entrega todavía`);
    }

    const ads = await g(`${cid}/ads`, { fields: 'name,effective_status,creative{body,title,object_story_spec}' });
    for (const ad of ads.data || []) {
      const cr = ad.creative || {};
      const oss = cr.object_story_spec || {};
      const body = cr.body || oss.video_data?.message || oss.link_data?.message || '(sin body)';
      const title = cr.title || oss.video_data?.title || oss.link_data?.name || '';
      console.log(`\n   🔸 ${ad.name} [${ad.effective_status}]`);
      console.log(`      title: ${title}`);
      console.log(`      body : ${JSON.stringify(body).slice(0, 400)}`);
    }
  }
}

run().catch((e) => {
  console.error('ERROR:', e.response?.data?.error?.message || e.message);
  process.exit(1);
});
