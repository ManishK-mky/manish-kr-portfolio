import { NotFoundException } from '@nestjs/common';
import type { Model } from 'mongoose';

export async function findByIdOrThrow<T>(
  model: Model<T>,
  id: string,
  entity: string,
) {
  const doc = await model.findById(id).lean().exec();
  if (!doc) throw new NotFoundException(`${entity} not found`);
  return doc;
}

export async function deleteByIdOrThrow<T>(
  model: Model<T>,
  id: string,
  entity: string,
) {
  const doc = await model.findByIdAndDelete(id).lean().exec();
  if (!doc) throw new NotFoundException(`${entity} not found`);
  return doc;
}

/** Persists a drag-and-drop ordering: each id's index becomes its `order`. */
export async function reorder<T>(model: Model<T>, ids: string[]) {
  if (ids.length === 0) return { updated: 0 };
  const result = await model.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    })) as Parameters<Model<T>['bulkWrite']>[0],
  );
  return { updated: result.modifiedCount };
}

/** Next `order` value so new records land at the end of the list. */
export async function nextOrder<T>(model: Model<T>, filter: object = {}) {
  const last = await model
    .findOne(filter)
    .sort({ order: -1 })
    .select('order')
    .lean<{ order?: number }>()
    .exec();
  return (last?.order ?? -1) + 1;
}
