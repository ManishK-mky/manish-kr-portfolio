import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

/**
 * One row per signed-in device. Only a SHA-256 hash of the current refresh
 * token is stored; each refresh rotates it. Presenting an older token for a
 * live session signals theft, and the session is revoked.
 */
@Schema({ timestamps: true, collection: 'auth_sessions' })
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, select: false })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  revokedAt?: Date;

  @Prop({ maxlength: 300 })
  userAgent?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
// MongoDB removes sessions automatically once they expire.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
