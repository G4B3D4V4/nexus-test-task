import { CatchError } from '@app/common';
import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class BucketService {
  private s3Client: S3;
  private bucketName: string;

  constructor(@InjectPinoLogger(BucketService.name) private logger: PinoLogger) {
    this.s3Client = new S3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      } as AWS.Credentials,
      endpoint: process.env.AWS_S3_URL,
      s3ForcePathStyle: true,
      region: process.env.AWS_REGION,
      logger: process.env.WRITE_LOGS_IN_FILE ? null : console,
    });

    this.bucketName = process.env.AWS_BUCKET_NAME;
    this._initializeBucket();
  }

  @CatchError(BucketService.name)
  private async _initializeBucket(): Promise<void> {
    const buckets = await this.s3Client.listBuckets().promise();
    const bucketExists = buckets.Buckets?.some(bucket => bucket.Name === this.bucketName);

    if (!bucketExists) {
      this.logger.info(`Bucket "${this.bucketName}" not found. Creating...`);

      const createBucketParams = {
        Bucket: this.bucketName,
      };

      const data = await this.s3Client.createBucket(createBucketParams).promise();
      this.logger.info(
        { data },
        `Bucket "${this.bucketName}" has been created at ${data.Location}`,
      );
    } else {
      this.logger.info(`Bucket "${this.bucketName}" already exists.`);
    }
  }

  @CatchError(BucketService.name)
  async upload(fileName: string, data: Buffer): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: `files/${fileName}`,
      Body: data,
    };

    const result = await this.s3Client.upload(params).promise();
    this.logger.info(
      { result },
      `File "${fileName}" has been uploaded to bucket "${this.bucketName}"`,
    );

    return result.Key;
  }

  @CatchError(BucketService.name)
  async download(fileName: string): Promise<Buffer> {
    const params = {
      Bucket: this.bucketName,
      Key: `files/${fileName}`,
    };

    const result = await this.s3Client.getObject(params).promise();
    this.logger.info(
      { result },
      `File "${fileName}" has been downloaded from bucket "${this.bucketName}"`,
    );

    return result.Body as Buffer;
  }

  @CatchError(BucketService.name)
  async delete(fileName: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: `files/${fileName}`,
    };

    const result = await this.s3Client.deleteObject(params).promise();
    this.logger.info(
      { result },
      `File "${fileName}" has been deleted from bucket "${this.bucketName}"`,
    );
  }
}
