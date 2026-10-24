import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { MediaReferenceRegistry } from '../media/media-reference.registry.js';
import { MediaService } from '../media/media.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Profile } from './schemas/profile.schema.js';

const DEFAULT_PROFILE = {
  key: 'main',
  name: 'Your Name',
  role: 'Full-stack engineer',
  greeting: 'Hi, I’m Your Name',
  headline: 'Building thoughtful digital experiences through code and design.',
  intro: '',
  bio: '',
  avatar: null,
  aboutImage: null,
  location: '',
  email: '',
  availability: { status: 'available', label: 'Available for new projects', visible: true },
  cv: null,
  stats: [],
};

@Injectable()
export class ProfileService implements OnModuleInit {
  constructor(
    @InjectModel(Profile.name) private readonly profiles: Model<Profile>,
    private readonly media: MediaService,
    private readonly references: MediaReferenceRegistry,
    private readonly revalidation: RevalidationService,
  ) {}

  onModuleInit() {
    this.references.register('Profile', ({ id }) =>
      this.profiles
        .countDocuments({
          $or: [{ 'avatar.mediaId': id }, { 'aboutImage.mediaId': id }, { 'cv.mediaId': id }],
        })
        .exec(),
    );
  }

  async get() {
    const profile = await this.profiles.findOne({ key: 'main' }).lean().exec();
    return profile ?? DEFAULT_PROFILE;
  }

  async update(dto: UpdateProfileDto) {
    const { avatar, aboutImage, cvMediaId, availability, ...rest } = dto;
    const $set: Record<string, unknown> = { ...rest };
    if (avatar !== undefined) $set.avatar = await this.media.resolveImage(avatar);
    if (aboutImage !== undefined) {
      $set.aboutImage = await this.media.resolveImage(aboutImage);
    }
    if (cvMediaId !== undefined) $set.cv = await this.media.resolveDocument(cvMediaId);
    if (availability) {
      for (const [k, v] of Object.entries(availability)) {
        if (v !== undefined) $set[`availability.${k}`] = v;
      }
    }

    const existing = await this.profiles.exists({ key: 'main' });
    const profile = await this.profiles
      .findOneAndUpdate(
        { key: 'main' },
        existing
          ? { $set }
          : // First save: fill required fields from defaults the admin didn't send.
            {
              $set,
              $setOnInsert: Object.fromEntries(
                Object.entries(DEFAULT_PROFILE).filter(
                  ([k]) => !(k in $set) && k !== 'key' && k !== 'availability',
                ),
              ),
            },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();
    this.revalidation.trigger(Tags.profile);
    return profile;
  }
}
