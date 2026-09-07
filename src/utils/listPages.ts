import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';
import { ENV } from '../config/env';
import { account } from '../core/metaClient';

async function findPageId() {
  // Buscar el Page ID a través de los anuncios existentes que ya tienen page_id
  console.log("\n🔍 Buscando Page ID a través de los anuncios existentes...\n");
  
  try {
    const ads = await account.getAds(
      ['id', 'name', 'creative'],
      { limit: 5 }
    );

    for (const ad of ads) {
      try {
        const creatives = await (ad as any).getAdCreatives(
          ['id', 'object_story_spec'],
          { limit: 1 }
        );
        
        if (creatives && creatives.length > 0) {
          const spec = creatives[0].object_story_spec;
          if (spec && spec.page_id) {
            console.log(`  ✅ Page ID encontrado: ${spec.page_id}`);
            console.log(`     (Extraído del anuncio: "${ad.name}")`);
            return;
          }
        }
      } catch {
        // continuar con el siguiente
      }
    }
    
    console.log("  ⚠️  No se pudo extraer el Page ID automáticamente.");
    console.log("  Ve a tu página de FB → Configuración → Transparencia → ID de la página");
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

findPageId();
