import { CatchError, DynamoDBItem, FileUploadDto } from '@app/common';
import { BucketService, DynamoDBService } from '@app/storage';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class FilesService {
  constructor(
    private _dynamoDBService: DynamoDBService,
    private _bucketService: BucketService,
  ) {}

  @CatchError(FilesService.name)
  async upload(file: FileUploadDto): Promise<DynamoDBItem> {
    const { buffer, originalname, size } = file;

    if (await this._dynamoDBService.getItemByName(originalname)) {
      throw new ConflictException('File already exists');
    }

    await this._bucketService.upload(originalname, buffer);

    return this._dynamoDBService.createItem(originalname, size);
  }

  @CatchError(FilesService.name)
  async download(fileName: string): Promise<DynamoDBItem> {
    const result = await this._dynamoDBService.getItemByName(fileName);

    if (!result) {
      throw new NotFoundException('File not found');
    }

    //Here it is possible to get the file buffer from the bucket

    return result;
  }

  @CatchError(FilesService.name)
  async update(fileName: string, file: FileUploadDto): Promise<DynamoDBItem> {
    const { buffer, originalname, size } = file;

    if (!(await this._dynamoDBService.getItemByName(fileName))) {
      throw new NotFoundException('File not found');
    }

    await this._bucketService.delete(fileName);

    await this._bucketService.upload(originalname, buffer);

    return this._dynamoDBService.update(fileName, originalname, size);
  }

  @CatchError(FilesService.name)
  async delete(fileName: string): Promise<void> {
    await this._bucketService.delete(fileName);

    await this._dynamoDBService.delete(fileName);
  }
}
