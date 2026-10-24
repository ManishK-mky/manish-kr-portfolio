import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

export type ReferenceCounter = (asset: {
  id: Types.ObjectId;
  url: string;
}) => Promise<number>;

/**
 * Feature modules register a counter for every place they store media. The
 * media service consults all of them before deleting an asset, so it never
 * needs to know about other modules' schemas.
 */
@Injectable()
export class MediaReferenceRegistry {
  private readonly counters = new Map<string, ReferenceCounter>();

  register(source: string, counter: ReferenceCounter) {
    this.counters.set(source, counter);
  }

  async usages(asset: { id: Types.ObjectId; url: string }) {
    const results = await Promise.all(
      [...this.counters].map(async ([source, count]) => ({
        source,
        count: await count(asset),
      })),
    );
    return results.filter((r) => r.count > 0);
  }
}
