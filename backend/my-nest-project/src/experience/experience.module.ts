import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../companies/schemas/company.schema.js';
import { ExperienceController } from './experience.controller.js';
import { ExperienceService } from './experience.service.js';
import { Experience, ExperienceSchema } from './schemas/experience.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experience.name, schema: ExperienceSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [ExperienceController],
  providers: [ExperienceService],
  exports: [ExperienceService],
})
export class ExperienceModule {}
