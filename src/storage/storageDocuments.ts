import { AppError } from "../errors/AppError";
import { supabase } from "../lib/supabase";
import crypto from "crypto";

const BUCKET_IMAGEM = process.env.SUPABASE_BUCKET_IMAGEM || "deppi-imagem";
const BUCKET_DOCS = process.env.SUPABASE_BUCKET_DOCS || "deppi-docs";

export const storageService = {
  async salvar(
    buffer: Buffer, 
    nomeOriginal: string, 
    subpasta: string,
    bucket: string = BUCKET_DOCS,
    contentType?: string,
  ){
    const nomeArquivo = `${crypto.randomUUID()}-$${nomeOriginal}`;
    const caminho = `${subpasta}/${nomeArquivo}`;

    const { error } = await supabase.storage
      .from("covers")
      .upload(caminho, buffer, {
        contentType: contentType,
      });

    if (error) {
      throw new AppError(error.message);
    }

    const { data } = supabase.storage
      .from("covers")
      .getPublicUrl(caminho);
    
    return { 
      nomeArquivo, 
      caminho: data.publicUrl, 
      bucket, 
      caminhoStorage: caminho
    };
  },

  async remover(
    caminho: string,
    bucket: string = BUCKET_DOCS
  ) {
    const url = new URL(caminho);

    const marker = `/storage/v1/object/public/${bucket}/`;

    if (!url.pathname.includes(marker)) {
      throw new AppError("URL do arquivo não pertence ao bucket esperado.");
    }

    const partes = url.pathname.split(marker);
    const caminhoCodificado = partes[1];

    if (!caminhoCodificado) {
      throw new AppError("Não foi possível identificar o caminho do arquivo no Supabase.");
    }

    const caminhoStorage = decodeURIComponent(caminhoCodificado);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([caminhoStorage]);

    if (error) {
      throw new AppError(`Erro ao remover arquivo: ${error.message}`);
    }
  },

  getUrlPublica(
    caminhoStorage: string,
    bucket: string = BUCKET_DOCS,
  ) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(caminhoStorage)

    return data.publicUrl;
  },

  getBucketImagem() {
    return BUCKET_IMAGEM;
  },

  getBucketDocumentos() {
    return BUCKET_DOCS;
  }

};