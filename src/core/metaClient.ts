import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import { ENV } from '../config/env';

// Inicializar la API globalmente
export const api = FacebookAdsApi.init(ENV.META_ACCESS_TOKEN);

// Instancia de la cuenta de anuncios
export const account = new AdAccount(ENV.META_AD_ACCOUNT_ID);
