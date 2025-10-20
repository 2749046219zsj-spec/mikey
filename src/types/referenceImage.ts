export interface ReferenceImage {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface ReferenceImageUpload {
  file: File;
  preview?: string;
}
