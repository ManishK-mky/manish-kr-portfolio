import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import type { GalleryImageDto, ImageRefDto } from '../common/dto/image-ref.dto.js';
import { paginationMeta } from '../common/dto/pagination-query.dto.js';
import type { GalleryImage, ImageRef } from '../common/schemas/image-ref.schema.js';
import { escapeRegex } from '../common/utils/regex.js';
import { CloudinaryService } from './cloudinary.service.js';
import type {
  MediaQueryDto,
  RegisterMediaDto,
  SignatureRequestDto,
} from './dto/media.dto.js';
import { MediaReferenceRegistry } from './media-reference.registry.js';
import {
  CLOUDINARY_ROOT,
  MEDIA_FOLDERS,
  MediaAsset,
  type MediaFolder,
} from './schemas/media-asset.schema.js';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'];
export const DOCUMENT_EXTENSIONS = ['pdf'];

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(MediaAsset.name) private readonly media: Model<MediaAsset>,
    private readonly cloudinary: CloudinaryService,
    private readonly references: MediaReferenceRegistry,
  ) {}

  /**
   * Signs the exact parameters the browser will send. Cloudinary rejects the
   * upload if any of them are altered, which pins the folder and formats.
   */
  createSignature(dto: SignatureRequestDto) {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `${CLOUDINARY_ROOT}/${dto.folder}`;
    const resourceType = dto.kind === 'document' ? 'raw' : 'image';
    const params: Record<string, string | number> = { timestamp, folder };
    if (resourceType === 'image') {
      params.allowed_formats = IMAGE_FORMATS.join(',');
    }
    const { signature, apiKey, cloudName } = this.cloudinary.sign(params);
    return {
      ...params,
      signature,
      apiKey,
      cloudName,
      resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      maxBytes: resourceType === 'image' ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES,
    };
  }

  /**
   * Persists an uploaded asset. Metadata is read back from Cloudinary rather
   * than trusted from the client; uploads that break the rules are destroyed.
   */
  async register(dto: RegisterMediaDto) {
    const folder = this.folderOf(dto.publicId);
    const resource = await this.cloudinary.getResource(
      dto.publicId,
      dto.resourceType,
    );
    if (!resource) {
      throw new NotFoundException('Asset not found in Cloudinary');
    }

    const problem = this.validateResource(resource, dto.resourceType);
    if (problem) {
      await this.cloudinary.destroy(dto.publicId, dto.resourceType);
      throw new UnprocessableEntityException(problem);
    }

    return this.media
      .findOneAndUpdate(
        { publicId: resource.public_id },
        {
          $set: {
            url: resource.secure_url,
            resourceType: dto.resourceType,
            folder,
            format: resource.format,
            bytes: resource.bytes,
            width: resource.width,
            height: resource.height,
            originalFilename: resource.original_filename ?? '',
            ...(dto.alt !== undefined ? { alt: dto.alt } : {}),
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();
  }

  async list(query: MediaQueryDto) {
    const filter: QueryFilter<MediaAsset> = {};
    if (query.folder) filter.folder = query.folder;
    if (query.resourceType) filter.resourceType = query.resourceType;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ originalFilename: rx }, { alt: rx }, { publicId: rx }];
    }
    const [items, total] = await Promise.all([
      this.media
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.media.countDocuments(filter).exec(),
    ]);
    return { items, meta: paginationMeta(query.page, query.limit, total) };
  }

  async findById(id: string) {
    const asset = await this.media.findById(id).lean().exec();
    if (!asset) throw new NotFoundException('Media asset not found');
    const usages = await this.references.usages({ id: asset._id, url: asset.url });
    return { ...asset, usages };
  }

  async updateAlt(id: string, alt: string) {
    const asset = await this.media
      .findByIdAndUpdate(id, { alt }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  async remove(id: string) {
    const asset = await this.media.findById(id).lean().exec();
    if (!asset) throw new NotFoundException('Media asset not found');
    const usages = await this.references.usages({ id: asset._id, url: asset.url });
    if (usages.length > 0) {
      throw new ConflictException({
        message: `This file is still used by: ${usages.map((u) => u.source).join(', ')}`,
        details: usages,
      });
    }
    await this.cloudinary.destroy(asset.publicId, asset.resourceType);
    await this.media.deleteOne({ _id: asset._id }).exec();
    return { deleted: true };
  }

  async resolveImage(ref: ImageRefDto): Promise<ImageRef>;
  async resolveImage(ref: ImageRefDto | null | undefined): Promise<ImageRef | null>;
  async resolveImage(ref: ImageRefDto | null | undefined): Promise<ImageRef | null> {
    if (!ref) return null;
    const asset = await this.media.findById(ref.mediaId).lean().exec();
    if (!asset) throw new BadRequestException(`Media ${ref.mediaId} does not exist`);
    if (asset.resourceType !== 'image') {
      throw new BadRequestException(`Media ${ref.mediaId} is not an image`);
    }
    return {
      mediaId: asset._id,
      url: asset.url,
      publicId: asset.publicId,
      width: asset.width,
      height: asset.height,
      alt: ref.alt ?? asset.alt ?? '',
    };
  }

  async resolveGallery(refs: GalleryImageDto[] | undefined): Promise<GalleryImage[]> {
    if (!refs?.length) return [];
    return Promise.all(
      refs.map(async (r) => ({
        ...(await this.resolveImage(r)),
        caption: r.caption ?? '',
      })),
    );
  }

  /** Resolves a downloadable document (e.g. the CV). */
  async resolveDocument(mediaId: string | null | undefined) {
    if (!mediaId) return null;
    const asset = await this.media.findById(mediaId).lean().exec();
    if (!asset) throw new BadRequestException(`Media ${mediaId} does not exist`);
    return {
      mediaId: asset._id,
      url: asset.url,
      publicId: asset.publicId,
      filename: asset.originalFilename,
    };
  }

  countByIds(ids: Types.ObjectId[]) {
    return this.media.countDocuments({ _id: { $in: ids } }).exec();
  }

  count() {
    return this.media.countDocuments().exec();
  }

  private folderOf(publicId: string): MediaFolder {
    const [root, folder] = publicId.split('/');
    if (root !== CLOUDINARY_ROOT || !MEDIA_FOLDERS.includes(folder as MediaFolder)) {
      throw new BadRequestException('Asset is outside the allowed folders');
    }
    return folder as MediaFolder;
  }

  private validateResource(
    resource: { resource_type: string; bytes: number; format?: string; public_id: string },
    expected: 'image' | 'raw',
  ): string | null {
    if (resource.resource_type !== expected) return 'Unexpected resource type';
    if (expected === 'image') {
      if (resource.bytes > MAX_IMAGE_BYTES) return 'Image exceeds the 10 MB limit';
      if (!resource.format || !IMAGE_FORMATS.includes(resource.format)) {
        return `Unsupported image format "${resource.format}"`;
      }
    } else {
      if (resource.bytes > MAX_DOCUMENT_BYTES) return 'File exceeds the 10 MB limit';
      const ext = resource.public_id.split('.').pop()?.toLowerCase();
      if (!ext || !DOCUMENT_EXTENSIONS.includes(ext)) {
        return 'Only PDF documents are allowed';
      }
    }
    return null;
  }
}
