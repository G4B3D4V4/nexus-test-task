import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { BucketService, DynamoDBService } from '@app/storage';
import { mockFileObj, mockDynamoDBItem } from '../../test/mocks/common-mocks';

describe('FilesController', () => {
  let filesController: FilesController;
  let filesService: FilesService;
  let logger: PinoLogger;
  let dynamoDBService: DynamoDBService;

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
      controllers: [FilesController],
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

    filesController = module.get<FilesController>(FilesController);
    filesService = module.get<FilesService>(FilesService);
    dynamoDBService = module.get<DynamoDBService>(DynamoDBService);
  });

  it('should be defined', () => {
    expect(filesController).toBeDefined();
  });

  it('should upload file', async () => {
    jest.spyOn(filesService, 'upload').mockResolvedValue(mockDynamoDBItem);

    expect(await filesController.uploadFile(mockFileObj)).toStrictEqual(mockDynamoDBItem);
  });

  it('should throw conflict exception if file already exists', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(mockDynamoDBItem);

    await expect(filesController.uploadFile(mockFileObj)).rejects.toMatchObject({
      message: 'File already exists',
    });
  });

  it('should download file', async () => {
    jest.spyOn(filesService, 'download').mockResolvedValue(mockDynamoDBItem);

    expect(await filesController.findOne('mocked-name')).toStrictEqual(mockDynamoDBItem);
  });

  it('should throw not found exception if file does not exist', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(null);

    await expect(filesController.findOne('mocked-name')).rejects.toMatchObject({
      message: 'File not found',
    });
  });

  it('should update file', async () => {
    jest.spyOn(filesService, 'update').mockResolvedValue(mockDynamoDBItem);

    expect(await filesController.update('mocked-name', mockFileObj)).toStrictEqual(
      mockDynamoDBItem,
    );
  });

  it('should throw not found exception if file does not exist', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(null);

    await expect(filesController.update('mocked-name', mockFileObj)).rejects.toMatchObject({
      message: 'File not found',
    });
  });

  it('should delete file', async () => {
    await expect(filesController.remove('mocked-name')).resolves.toBeUndefined();
  });
});
