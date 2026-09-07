import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID || '',
};

if (!ENV.META_ACCESS_TOKEN || !ENV.META_AD_ACCOUNT_ID) {
  console.error("Faltan las variables de entorno META_ACCESS_TOKEN o META_AD_ACCOUNT_ID en el archivo .env");
  process.exit(1);
}
