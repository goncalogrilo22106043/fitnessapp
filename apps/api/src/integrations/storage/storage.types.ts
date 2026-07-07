export interface UploadTarget {
  bucket: "meal-photos" | "profile-media";
  path: string;
  contentType: string;
}

export interface StorageGateway {
  createSignedUploadUrl(target: UploadTarget): Promise<{ url: string; path: string }>;
}
