import { Test, TestingModule } from '@nestjs/testing';
import * as AWS from 'aws-sdk';
import { DynamoDBService } from './dynamo-db.service';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import {
  mockFileObj,
  mockQueryOutput,
  mockDynamoDBItem,
} from '../../../../test/mocks/common-mocks';
import { NotFoundException } from '@nestjs/common';

describe('BucketService', () => {
  let dynamoDBService: DynamoDBService;
  let dynamoDBClient: AWS.DynamoDB.DocumentClient;
  let logger: PinoLogger;

  const mockDynamoDBService = {
    _initializeTable: jest.fn().mockResolvedValue(undefined),

    createItem: jest.fn().mockResolvedValue(mockDynamoDBItem),
    getItemByName: jest.fn().mockResolvedValue(mockDynamoDBItem),
    update: jest.fn().mockResolvedValue(mockDynamoDBItem),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    logger = new PinoLogger({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBService,
        { provide: DynamoDBService, useValue: mockDynamoDBService },
        { provide: getLoggerToken(DynamoDBService.name), useValue: logger },
        { provide: getLoggerToken(`decorators_${DynamoDBService.name}`), useValue: logger },
      ],
    }).compile();

    dynamoDBService = module.get<DynamoDBService>(DynamoDBService);
    dynamoDBClient = new AWS.DynamoDB.DocumentClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(dynamoDBService).toBeDefined();
  });

  it('should create item', async () => {
    jest.spyOn(dynamoDBClient, 'put').mockImplementation(() => void 0);

    expect(
      await dynamoDBService.createItem(mockFileObj.originalname, mockFileObj.size),
    ).toStrictEqual(mockDynamoDBItem);
  });

  it('should get item by name', async () => {
    jest.spyOn(dynamoDBClient, 'query').mockImplementation(() => mockQueryOutput as any);

    expect(await dynamoDBService.getItemByName(mockFileObj.originalname)).toStrictEqual(
      mockDynamoDBItem,
    );
  });

  it('should update item', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(mockDynamoDBItem);
    jest.spyOn(dynamoDBClient, 'update').mockImplementation(() => void 0);

    expect(
      await dynamoDBService.update(mockFileObj.originalname, 'mocked-name', 100),
    ).toStrictEqual(mockDynamoDBItem);
  });

  it('should throw NotFoundException when updating non-existing item', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockImplementation(() => void 0);
    jest
      .spyOn(dynamoDBService, 'update')
      .mockRejectedValue(new NotFoundException('Item not found'));

    await expect(
      dynamoDBService.update(mockFileObj.originalname, 'mocked-name', 100),
    ).rejects.toMatchObject({ message: 'Item not found' });
  });

  it('should delete item', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockResolvedValue(mockDynamoDBItem);
    jest.spyOn(dynamoDBClient, 'delete').mockImplementation(() => void 0);

    expect(await dynamoDBService.delete(mockFileObj.originalname)).toBeUndefined();
  });

  it('should throw NotFoundException when deleting non-existing item', async () => {
    jest.spyOn(dynamoDBService, 'getItemByName').mockImplementation(() => void 0);
    jest
      .spyOn(dynamoDBService, 'delete')
      .mockRejectedValue(new NotFoundException('Item not found'));

    await expect(dynamoDBService.delete(mockFileObj.originalname)).rejects.toMatchObject({
      message: 'Item not found',
    });
  });
});
