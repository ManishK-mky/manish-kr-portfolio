import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsModule } from '../settings/settings.module.js';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';
import { ContactMessage, ContactMessageSchema } from './schemas/contact-message.schema.js';

@Module({
  imports: [
    SettingsModule,
    MongooseModule.forFeature([{ name: ContactMessage.name, schema: ContactMessageSchema }]),
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
