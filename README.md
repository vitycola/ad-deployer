# ad-deployer

Herramienta interna para desplegar campañas de Meta Ads a partir de
archivos de estrategia en JSON, usando `facebook-nodejs-business-sdk`.

## Requisitos

- Node.js + `npm install`
- Un archivo `.env` en la raíz (no versionado):

  ```
  META_ACCESS_TOKEN=<token de Usuario del Sistema con ads_management + business_management>
  META_AD_ACCOUNT_ID=<id numérico de la cuenta publicitaria>
  ```

## Uso

```bash
# Analizar todas las campañas de la cuenta (histórico completo)
npx ts-node src/analyze_full.ts

# Desplegar una estrategia completa (campaña + conjunto + anuncios), en PAUSA
npx ts-node src/deploy_fase2.ts data/mi-estrategia.json

# Crear sólo los anuncios sobre un conjunto ya existente
npx ts-node src/deploy_ads_only.ts <adset_id> data/mi-estrategia.json
```

Todo se crea en estado `PAUSED`: la activación es manual desde Ads Manager.

## Estructura

- `src/services/deploy/` — deployers de campaña, conjunto, creativo y anuncio
- `src/services/analyze/` — análisis de campañas
- `data/strategy.example.json` — plantilla de estrategia (las reales van en `data/`, ignoradas por git)
- `docs/` — página de política de privacidad (GitHub Pages)

## Política de privacidad

<https://vitycola.github.io/ad-deployer/>
