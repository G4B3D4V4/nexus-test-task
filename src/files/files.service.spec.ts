import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { BucketService, DynamoDBService } from '@app/storage';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { mockFileObj, mockDynamoDBItem } from '../../test/mocks/common-mocks';

describe('FilesService', () => {
  let filesService: FilesService;
  let dynamoDBService: DynamoDBService;
  let bucketService: BucketService;
  let logger: PinoLogger;

  const mockBucketService = {
    _initializeBucket: jest.fn().mockResolvedValue(undefined),

    upload: jest.fn().mockResolvedValue('mocked-file-key'),
    delete: jest.fn().mockResolvedValue(undefined),
    download: jest.fn().mockResolvedValue(Buffer.from('mocked-file-content')),
  };

  const mockDynamoDBService = {
    _initializeTable: jest.fn().mockResolvedValue(undefined),

    createItem: jest.fn().mockResolvedValue({ id: 'mocked-id', name: 'mocked-name', size: 100 }),
    getItemByName: jest.fn().mockResolvedValue({ id: 'mocked-id', name: 'mocked-name', size: 100 }),
    update: jest.fn().mockResolvedValue({ id: 'mocked-id', name: 'mocked-name', size: 100 }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    logger = new PinoLogger({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        DynamoDBService,
        BucketService,
        { provide: BucketService, useValue: mockBucketService },
        { provide: DynamoDBService, useValue: mockDynamoDBService },
        { provide: getLoggerToken(FilesService.name), useValue: logger },
        { provide: getLoggerToken(DynamoDBService.name), useValue: logger },
        { provide: getLoggerToken(BucketService.name), useValue: logger },
        { provide: getLoggerToken(`decorators_${FilesService.name}`), useValue: logger },
        { provide: getLoggerToken(`decorators_${BucketService.name}`), useValue: logger },
        { provide: getLoggerToken(`decorators_${DynamoDBService.name}`), useValue: logger },
      ],
    }).compile();

    filesService = module.get<FilesService>(FilesService);
    dynamoDBService = module.get<DynamoDBService>(DynamoDBService);
    bucketService = module.get<BucketService>(BucketService);
  });

  it('should be defined', () => {
    expect(filesService).toBeDefined();
  });

  it('should upload file', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(null);
    jest.spyOn(bucketService, 'upload').mockResolvedValue('mocked-file-key');
    jest.spyOn(dynamoDBService, 'createItem').mockResolvedValue(mockDynamoDBItem);

    expect(await filesService.upload(mockFileObj)).toStrictEqual(mockDynamoDBItem);
  });

  it('should throw conflict exception if it already exists', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(mockDynamoDBItem);

    await expect(filesService.upload(mockFileObj)).rejects.toMatchObject({
      message: 'File already exists',
    });
  });

  it('should download file', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(mockDynamoDBItem);

    expect(await filesService.download('mocked-name')).toStrictEqual(mockDynamoDBItem);
  });

  it('should throw not found exception on download if it does not exist', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(null);

    await expect(filesService.download('mocked-name')).rejects.toMatchObject({
      message: 'File not found',
    });
  });

  it('should update file', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(mockDynamoDBItem);
    jest.spyOn(bucketService, 'delete').mockResolvedValue(undefined);
    jest.spyOn(bucketService, 'upload').mockResolvedValue('mocked-file-key');
    jest.spyOn(dynamoDBService, 'update').mockResolvedValue(mockDynamoDBItem);

    expect(await filesService.update('mocked-name', mockFileObj)).toStrictEqual(mockDynamoDBItem);
  });

  it('should throw not found exception on update if current file does not exist', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(null);

    await expect(filesService.update('mocked-name', mockFileObj)).rejects.toMatchObject({
      message: 'File not found',
    });
  });

  it('should delete file', async () => {
    jest.spyOn(bucketService, 'delete').mockResolvedValue(undefined);
    jest.spyOn(dynamoDBService, 'delete').mockResolvedValue(undefined);

    await expect(filesService.delete('mocked-name')).resolves.toBeUndefined();
  });
});
