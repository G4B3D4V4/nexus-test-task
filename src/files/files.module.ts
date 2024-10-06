import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { BucketService, DynamoDBService } from '@app/storage';

@Module({
  providers: [FilesService, DynamoDBService, BucketService],
  controllers: [FilesController],
})
export class FilesModule {}
