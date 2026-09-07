import { account } from '../../core/metaClient';

interface CampaignInsight {
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
}

// Patrones para detectar campañas de venta de entradas / conciertos
const TICKET_KEYWORDS = [
  // Provincias y ciudades españolas
  'sevilla', 'madrid', 'barcelona', 'málaga', 'malaga', 'cádiz', 'cadiz',
  'granada', 'córdoba', 'cordoba', 'huelva', 'almería', 'almeria', 'jaén', 'jaen',
  'valencia', 'bilbao', 'zaragoza', 'murcia', 'alicante', 'osuna', 'écija', 'ecija',
  'utrera', 'jerez', 'marbella', 'ronda', 'antequera', 'linares',
  // Palabras clave de venta
  'entrada', 'entradas', 'ticket', 'tickets', 'concierto', 'gira', 'show',
  'directo', 'en vivo', 'actuaci', 'bolo', 'fecha',
  // Meses y años (para capturar fechas en nombres)
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  '2024', '2025', '2026',
];

function isTicketCampaign(name: string): boolean {
  const lower = name.toLowerCase();
  return TICKET_KEYWORDS.some(kw => lower.includes(kw));
}

export class CampaignAnalyzer {
  public async analyze(): Promise<void> {
    console.log("\n🔍 Obteniendo campañas desde Meta API (historial completo)...\n");
    try {
      // Traer hasta 100 campañas para no perdernos ninguna
      const campaigns = await account.getCampaigns(
        ['id', 'name', 'status', 'objective'],
        { limit: 100 }
      );

      console.log(`   Total de campañas encontradas: ${campaigns.length}`);
      console.log("   Filtrando campañas de venta de entradas y conciertos...\n");

      const insights: CampaignInsight[] = [];

      for (const camp of campaigns) {
        // Solo procesamos las que parecen de venta de tickets
        if (!isTicketCampaign(camp.name)) continue;

        try {
          const campaignInsights = await (camp as any).getInsights(
            ['spend', 'reach', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'frequency', 'date_start', 'date_stop'],
            {
              date_preset: 'maximum', // Todo el historial disponible
              level: 'campaign'
            }
          );

          if (campaignInsights && campaignInsights.length > 0) {
            const ins = campaignInsights[0];
            insights.push({
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
            });
          } else {
            // Sin insights pero sí es de tickets: la apuntamos igual con ceros
            insights.push({
              id: camp.id,
              name: camp.name,
              status: camp.status,
              objective: camp.objective,
              spend: 0, reach: 0, impressions: 0, clicks: 0,
              ctr: 0, cpc: 0, cpm: 0, frequency: 0,
              date_start: '-', date_stop: '-'
            });
          }
        } catch {
          // Sin datos suficientes
        }
      }

      if (insights.length === 0) {
        console.log("⚠️  No se encontraron campañas de venta de entradas/conciertos.");
        console.log("   Asegúrate de que el nombre de la campaña incluye la ciudad, fecha o la palabra 'entradas'.");
        return;
      }

      // Ordenar por gasto
      insights.sort((a, b) => b.spend - a.spend);

      const withData = insights.filter(i => i.spend > 0);
      const totalSpend = withData.reduce((sum, i) => sum + i.spend, 0);
      const totalReach = withData.reduce((sum, i) => sum + i.reach, 0);
      const totalClicks = withData.reduce((sum, i) => sum + i.clicks, 0);
      const avgCTR = withData.length > 0 ? withData.reduce((sum, i) => sum + i.ctr, 0) / withData.length : 0;
      const avgCPC = withData.filter(i => i.cpc > 0).length > 0
        ? withData.filter(i => i.cpc > 0).reduce((sum, i) => sum + i.cpc, 0) / withData.filter(i => i.cpc > 0).length
        : 0;

      console.log("═══════════════════════════════════════════════════════════════════");
      console.log("   🎫  CAMPAÑAS DE CONCIERTOS / VENTA DE ENTRADAS - LOS JALEO     ");
      console.log("═══════════════════════════════════════════════════════════════════\n");

      console.log(`📌 RESUMEN (${insights.length} campañas detectadas, ${withData.length} con datos):`);
      console.log(`   Gasto total         : ${totalSpend.toFixed(2)} €`);
      console.log(`   Alcance total       : ${totalReach.toLocaleString('es-ES')} personas`);
      console.log(`   Clics totales       : ${totalClicks.toLocaleString('es-ES')}`);
      console.log(`   CTR promedio        : ${avgCTR.toFixed(2)}%`);
      console.log(`   CPC promedio        : ${avgCPC.toFixed(2)} €`);
      console.log(`   Coste/1K personas   : ${totalReach > 0 ? ((totalSpend / totalReach) * 1000).toFixed(2) : 'N/A'} €`);

      console.log("\n───────────────────────────────────────────────────────────────────");
      console.log("📋 DETALLE POR CAMPAÑA:");
      console.log("───────────────────────────────────────────────────────────────────");

      insights.forEach((c, i) => {
        const name = c.name.length > 70 ? c.name.substring(0, 70) + '...' : c.name;
        const status = c.status === 'ACTIVE' ? '🟢 ACTIVA' : '⏸️  PAUSA';
        const costPer1k = c.spend > 0 && c.reach > 0 ? `${((c.spend / c.reach) * 1000).toFixed(2)}€/1K` : 'sin datos';

        console.log(`\n  ${i + 1}. ${name}`);
        console.log(`     Estado    : ${status} | Objetivo: ${c.objective}`);
        if (c.spend > 0) {
          console.log(`     Gasto     : ${c.spend.toFixed(2)}€ | Alcance: ${c.reach.toLocaleString('es-ES')} personas | ${costPer1k}`);
          console.log(`     Clics     : ${c.clicks.toLocaleString('es-ES')} | CTR: ${c.ctr.toFixed(2)}% | CPC: ${c.cpc > 0 ? c.cpc.toFixed(2) + '€' : 'N/A'} | Frec: ${c.frequency.toFixed(1)}x`);
          console.log(`     Período   : ${c.date_start} → ${c.date_stop}`);
        } else {
          console.log(`     Sin datos de rendimiento disponibles`);
        }
      });

      // Análisis comparativo
      if (withData.length >= 2) {
        const best = [...withData].sort((a, b) => b.ctr - a.ctr)[0];
        const mostEfficient = [...withData].filter(i => i.cpc > 0).sort((a, b) => a.cpc - b.cpc)[0];
        const mostReach = [...withData].sort((a, b) => b.reach - a.reach)[0];

        console.log("\n═══════════════════════════════════════════════════════════════════");
        console.log("💡 CONCLUSIONES PARA CAMPAÑAS DE CONCIERTOS:");
        console.log("═══════════════════════════════════════════════════════════════════");
        console.log(`  🏆 Mejor CTR      : "${best.name.substring(0, 55)}..."`);
        console.log(`                      → ${best.ctr.toFixed(2)}% CTR con ${best.spend.toFixed(2)}€ gastados`);
        if (mostEfficient) {
          console.log(`  💰 Más eficiente  : "${mostEfficient.name.substring(0, 55)}..."`);
          console.log(`                      → ${mostEfficient.cpc.toFixed(2)}€/clic | ${mostEfficient.clicks} clics totales`);
        }
        console.log(`  👥 Mayor alcance  : "${mostReach.name.substring(0, 55)}..."`);
        console.log(`                      → ${mostReach.reach.toLocaleString('es-ES')} personas con ${mostReach.spend.toFixed(2)}€`);
        console.log("\n  📌 Para tu próxima campaña de concierto, el presupuesto óptimo");
        console.log(`     estimado es ${(totalSpend / insights.length).toFixed(2)}€ de media por fecha.`);
      }

      console.log("\n═══════════════════════════════════════════════════════════════════\n");

    } catch (error: any) {
      console.error("❌ Error al obtener campañas:", error.message || error);
    }
  }
}
