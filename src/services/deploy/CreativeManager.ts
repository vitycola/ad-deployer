import { account } from '../../core/metaClient';
import { ENV } from '../../config/env';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB por chunk

export class CreativeManager {
  /**
   * Sube un video grande por partes (chunked upload) a la API de Meta.
   * Necesario para videos > 10MB.
   */
  public async uploadVideo(videoPath: string): Promise<string> {
    const absolutePath = path.resolve(videoPath);
    const fileSize = fs.statSync(absolutePath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    
    console.log(`Subiendo video (${fileSizeMB}MB) por partes (chunked upload)...`);

    // PASO 1: Iniciar la sesión de subida
    console.log("  → Iniciando sesión de subida...");
    const startResponse = await axios.post(
      `${GRAPH_API_BASE}/${ENV.META_AD_ACCOUNT_ID}/advideos`,
      null,
      {
        params: {
          access_token: ENV.META_ACCESS_TOKEN,
          upload_phase: 'start',
          file_size: fileSize
        }
      }
    );

    const { upload_session_id, video_id } = startResponse.data;
    console.log(`  → Sesión iniciada. Video ID: ${video_id}`);

    // PASO 2: Subir el archivo en chunks de 4MB
    const fileBuffer = fs.readFileSync(absolutePath);
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    let startOffset = 0;

    for (let i = 0; i < totalChunks; i++) {
      const endOffset = Math.min(startOffset + CHUNK_SIZE, fileSize);
      const chunk = fileBuffer.subarray(startOffset, endOffset);

      const form = new FormData();
      form.append('access_token', ENV.META_ACCESS_TOKEN);
      form.append('upload_phase', 'transfer');
      form.append('upload_session_id', upload_session_id);
      form.append('start_offset', String(startOffset));
      form.append('video_file_chunk', chunk, {
        filename: 'chunk.mp4',
        contentType: 'video/mp4'
      });

      const transferResponse = await axios.post(
        `${GRAPH_API_BASE}/${ENV.META_AD_ACCOUNT_ID}/advideos`,
        form,
        { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity }
      );

      startOffset = parseInt(transferResponse.data.start_offset);
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      console.log(`  → Parte ${i + 1}/${totalChunks} subida (${progress}%)`);
    }

    // PASO 3: Finalizar la subida
    console.log("  → Finalizando subida...");
    await axios.post(
      `${GRAPH_API_BASE}/${ENV.META_AD_ACCOUNT_ID}/advideos`,
      null,
      {
        params: {
          access_token: ENV.META_ACCESS_TOKEN,
          upload_phase: 'finish',
          upload_session_id: upload_session_id,
          title: path.basename(videoPath, '.mp4')
        }
      }
    );

    console.log(`✅ Video subido exitosamente. ID: ${video_id}`);
    return video_id;
  }

  /**
   * Sube una imagen estática a la API de Meta para usar en anuncios.
   */
  public async uploadImage(imagePath: string): Promise<string> {
    const absolutePath = path.resolve(imagePath);
    console.log(`Subiendo imagen: ${path.basename(absolutePath)}...`);

    const form = new FormData();
    form.append('access_token', ENV.META_ACCESS_TOKEN);
    form.append('filename', fs.createReadStream(absolutePath));

    try {
      const response = await axios.post(
        `${GRAPH_API_BASE}/${ENV.META_AD_ACCOUNT_ID}/adimages`,
        form,
        { headers: form.getHeaders() }
      );

      // Meta devuelve un objeto con un hash que es el ID de la imagen subida
      // formato: { "images": { "filename": { "hash": "..." } } }
      const imagesHash = response.data.images;
      const firstKey = Object.keys(imagesHash)[0];
      const imageHash = imagesHash[firstKey].hash;

      console.log(`✅ Imagen subida exitosamente. Hash: ${imageHash}`);
      return imageHash;
    } catch (error: any) {
      console.error("❌ Error al subir la imagen:", error.response?.data || error.message);
      throw error;
    }
  }
}
