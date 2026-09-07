/**
 * Borra entidades de Meta Ads por ID (anuncios, conjuntos o campañas).
 *
 *   npx ts-node src/delete_ads.ts <id> [<id> ...]
 */
import axios from 'axios';
import { ENV } from './config/env';

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

async function run() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Uso: npx ts-node src/delete_ads.ts <id> [<id> ...]");
    process.exit(1);
  }

  for (const id of ids) {
    try {
      const res = await axios.delete(`${GRAPH_API_BASE}/${id}`, {
        params: { access_token: ENV.META_ACCESS_TOKEN },
      });
      console.log(`✅ Borrado ${id}: ${JSON.stringify(res.data)}`);
    } catch (e: any) {
      console.error(`❌ ${id}: ${e.response?.data?.error?.message || e.message || e}`);
    }
  }
}

run();
