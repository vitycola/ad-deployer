import { account } from '../../core/metaClient';
import { Ad } from 'facebook-nodejs-business-sdk';
import { ENV } from '../../config/env';
import axios from 'axios';

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

export class AdDeployer {
  public async deploy(
    adSetId: string,
    pageId: string,
    adData: any,
    mediaParams: { videoId?: string; imageHash?: string }
  ): Promise<string> {
    console.log(`Creando Anuncio: ${adData.name}...`);
    try {
      let objectStorySpec: any = { page_id: pageId };

      if (mediaParams.videoId) {
        // --- LÓGICA PARA VÍDEO ---
        console.log("  → Obteniendo thumbnail del video...");
        let thumbnailUrl: string | undefined;
        const maxThumbAttempts = 8;
        for (let attempt = 1; attempt <= maxThumbAttempts; attempt++) {
          const thumbResponse = await axios.get(
            `${GRAPH_API_BASE}/${mediaParams.videoId}/thumbnails`,
            { params: { access_token: ENV.META_ACCESS_TOKEN } }
          );
          thumbnailUrl = thumbResponse.data?.data?.[0]?.uri;
          if (thumbnailUrl) break;
          if (attempt < maxThumbAttempts) {
            console.log(`  → Video aún procesándose, reintento ${attempt}/${maxThumbAttempts - 1} en 15s...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }
        if (!thumbnailUrl) {
          throw new Error("No se pudo obtener el thumbnail del video tras varios intentos. Es posible que el video aún esté procesándose.");
        }
        console.log("  → Thumbnail obtenido.");

        const videoData: any = {
          video_id: mediaParams.videoId,
          message: adData.primary_text,
          title: adData.headline,
          image_url: thumbnailUrl
        };

        if (adData.link_url) {
          videoData.call_to_action = {
            type: adData.call_to_action || 'LEARN_MORE',
            value: { link: adData.link_url }
          };
        }
        objectStorySpec.video_data = videoData;

      } else if (mediaParams.imageHash) {
        // --- LÓGICA PARA IMAGEN ESTÁTICA ---
        const linkData: any = {
          image_hash: mediaParams.imageHash,
          message: adData.primary_text,
          link: adData.link_url
        };

        if (adData.call_to_action) {
          linkData.call_to_action = {
            type: adData.call_to_action,
            value: { link: adData.link_url }
          };
        }
        
        // title y description solo si hay link
        if (adData.headline) linkData.name = adData.headline;
        
        objectStorySpec.link_data = linkData;
      } else {
        throw new Error("Debes proporcionar videoId o imageHash para crear un anuncio.");
      }

      // 1. Crear el AdCreative
      const creative = await account.createAdCreative(
        [],
        {
          name: `${adData.name} - Creative`,
          object_story_spec: objectStorySpec
        }
      );
      console.log(`  ✅ AdCreative creado. ID: ${creative.id}`);

      // 2. Crear el Ad asociado al AdSet
      const ad = await account.createAd(
        [],
        {
          name: adData.name,
          adset_id: adSetId,
          creative: { creative_id: creative.id },
          status: Ad.Status.paused
        }
      );
      
      console.log(`  ✅ Anuncio creado exitosamente. ID: ${ad.id}`);
      return ad.id;
    } catch (error) {
      console.error(`❌ Error al crear el anuncio ${adData.name}:`, error);
      throw error;
    }
  }
}
