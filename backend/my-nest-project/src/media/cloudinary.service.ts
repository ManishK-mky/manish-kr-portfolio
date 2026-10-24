import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { AppConfigService } from '../config/app-config.service.js';

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'raw' | 'video';
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  original_filename?: string;
}

/** Thin wrapper so the rest of the app never touches the API secret. */
@Injectable()
export class CloudinaryService {
  constructor(private readonly config: AppConfigService) {
    const { cloudName, apiKey, apiSecret, configured } = config.cloudinary;
    if (configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  get configured() {
    return this.config.cloudinary.configured;
  }

  private assertConfigured() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
  }

  sign(params: Record<string, string | number>) {
    this.assertConfigured();
    const { apiSecret, apiKey, cloudName } = this.config.cloudinary;
    return {
      signature: cloudinary.utils.api_sign_request(params, apiSecret!),
      apiKey: apiKey!,
      cloudName: cloudName!,
    };
  }

  async getResource(
    publicId: string,
    resourceType: 'image' | 'raw',
  ): Promise<CloudinaryResource | null> {
    this.assertConfigured();
    try {
      return (await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      })) as CloudinaryResource;
    } catch (err) {
      const code = (err as { error?: { http_code?: number } }).error?.http_code;
      if (code === 404) return null;
      throw err;
    }
  }

  async destroy(publicId: string, resourceType: 'image' | 'raw') {
    if (!this.configured) return;
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  }
}
