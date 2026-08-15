import "dotenv/config"
import { AppError } from "../errors/AppError";
import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseURL || !supabaseKey) {
    throw new AppError("SupabaseUrl ou SupabaseKey estão faltando.");
}

export const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || "deppi-files";
export const supabase = createClient(supabaseURL, supabaseKey);