import { StorageGateway, UploadTarget } from "./storage.types.js";

export class SupabaseStorageGateway implements StorageGateway {
  async createSignedUploadUrl(target: UploadTarget): Promise<{ url: string; path: string }> {
    void target;
    throw new Error("Supabase Storage credentials are not configured yet.");
  }
}
