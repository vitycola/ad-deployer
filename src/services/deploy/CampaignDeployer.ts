import { account } from '../../core/metaClient';
import { Campaign } from 'facebook-nodejs-business-sdk';

export class CampaignDeployer {
  public async deploy(campaignData: any): Promise<string> {
    console.log("Creando Campaña...");
    try {
      const campaign = await account.createCampaign(
        [],
        {
          name: campaignData.name,
          objective: campaignData.objective,
          status: Campaign.Status.paused,
          special_ad_categories: ['NONE'],
          is_adset_budget_sharing_enabled: false
        }
      );
      console.log(`✅ Campaña creada exitosamente. ID: ${campaign.id}`);
      return campaign.id;
    } catch (error) {
      console.error("❌ Error al crear la campaña:", error);
      throw error;
    }
  }
}
