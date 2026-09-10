/**
 * Cambia el estado de entidades de Meta Ads (anuncios, conjuntos, campañas).
 *
 *   npx ts-node src/set_status.ts <ACTIVE|PAUSED> <id> [<id> ...]
 */
import axios from 'axios';
import { ENV } from './config/env';

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

async function run() {
  const [status, ...ids] = process.argv.slice(2);
  if (!['ACTIVE', 'PAUSED'].includes(status) || ids.length === 0) {
    console.error("Uso: npx ts-node src/set_status.ts <ACTIVE|PAUSED> <id> [<id> ...]");
    process.exit(1);
  }

  for (const id of ids) {
    try {
      const res = await axios.post(`${GRAPH_API_BASE}/${id}`, null, {
        params: { access_token: ENV.META_ACCESS_TOKEN, status },
      });
      console.log(`✅ ${id} -> ${status}: ${JSON.stringify(res.data)}`);
    } catch (e: any) {
      console.error(`❌ ${id}: ${e.response?.data?.error?.message || e.message || e}`);
    }
  }
}

run();
