import { account } from '../../core/metaClient';
import { AdSet } from 'facebook-nodejs-business-sdk';

export class AdSetDeployer {
  public async deploy(campaignId: string, adSetData: any): Promise<string> {
    console.log("Creando Conjunto de Anuncios...");
    try {
      // Construir targeting desde la estrategia o usar España por defecto
      const targeting: any = adSetData.targeting || {
        geo_locations: { countries: ['ES'] }
      };

      // Añadir publicos personalizados (Retargeting)
      if (adSetData.include_audience_ids && adSetData.include_audience_ids.length > 0) {
        targeting.custom_audiences = adSetData.include_audience_ids.map((id: string) => ({ id }));
      }

      // Aplicar exclusiones de audiencia si las hay
      if (adSetData.exclude_audience_ids && adSetData.exclude_audience_ids.length > 0) {
        targeting.excluded_custom_audiences = adSetData.exclude_audience_ids.map((id: string) => ({ id }));
      }

      const adSetParams: any = {
        name: adSetData.name,
        campaign_id: campaignId,
        daily_budget: adSetData.daily_budget,
        billing_event: adSetData.billing_event,
        optimization_goal: adSetData.optimization_goal,
        bid_strategy: adSetData.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
        status: AdSet.Status.paused,
        targeting: {
          ...targeting,
          targeting_automation: {
            advantage_audience: 0
          }
        }
      };

      if (adSetData.start_time) adSetParams.start_time = adSetData.start_time;
      if (adSetData.end_time) adSetParams.end_time = adSetData.end_time;
      if (adSetData.frequency_control_specs) adSetParams.frequency_control_specs = adSetData.frequency_control_specs;

      const adSet = await account.createAdSet([], adSetParams);
      console.log(`✅ Conjunto de anuncios creado exitosamente. ID: ${adSet.id}`);
      return adSet.id;
    } catch (error) {
      console.error("❌ Error al crear el conjunto de anuncios:", error);
      throw error;
    }
  }
}
