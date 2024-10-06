import { Test, TestingModule } from '@nestjs/testing';
import { S3 } from 'aws-sdk';
import { BucketService } from './bucket.service';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { mockSendData, mockFileBuffer, mockFileObj } from '../../../../test/mocks/common-mocks';

describe('BucketService', () => {
  let service: BucketService;
  let s3: S3;
  let logger: PinoLogger;

  const mockBucketService = {
    upload: jest.fn().mockResolvedValue(mockSendData.Key),
    delete: jest.fn().mockResolvedValue(undefined),
    download: jest.fn().mockResolvedValue(Buffer.from('mocked-file-content')),
  };

  beforeEach(async () => {
    logger = new PinoLogger({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BucketService,
        { provide: BucketService, useValue: mockBucketService },
        { provide: getLoggerToken(BucketService.name), useValue: logger },
        { provide: getLoggerToken(`decorators_${BucketService.name}`), useValue: logger },
      ],
    }).compile();

    service = module.get<BucketService>(BucketService);
    s3 = new S3();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload file', async () => {
    const data = Buffer.from('mocked-file-content');
    jest.spyOn(s3, 'upload').mockReturnValue({
      promise: jest.fn().mockReturnValue(mockSendData),
    } as any);

    expect(await service.upload(mockFileObj.originalname, data)).toStrictEqual(mockSendData.Key);
  });

  it('should download file', async () => {
    jest.spyOn(s3, 'getObject').mockReturnValue({
      promise: jest.fn().mockReturnValue({ Body: mockFileBuffer }),
    } as any);

    expect(await service.download(mockFileObj.originalname)).toStrictEqual(mockFileBuffer);
  });

  it('should delete file', async () => {
    jest.spyOn(s3, 'deleteObject').mockReturnValue({
      promise: jest.fn().mockReturnValue(undefined),
    } as any);

    expect(await service.delete(mockFileObj.originalname)).toBeUndefined();
  });
});
