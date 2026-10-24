import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'contact_messages' })
export class ContactMessage {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, maxlength: 254 })
  email: string;

  @Prop({ default: '', trim: true, maxlength: 160 })
  subject: string;

  @Prop({ required: true, maxlength: 5000 })
  message: string;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop({ default: '', maxlength: 300 })
  userAgent: string;
}

export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);
ContactMessageSchema.index({ createdAt: -1 });
