import { CatchError, DynamoDBItem } from '@app/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DynamoDBService {
  private readonly dynamoDbClient: AWS.DynamoDB.DocumentClient;
  private readonly dynamoDb: AWS.DynamoDB;
  private readonly tableName: string;

  constructor(@InjectPinoLogger(DynamoDBService.name) private readonly logger: PinoLogger) {
    this.dynamoDbClient = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_DYNAMODB_URL,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });

    this.dynamoDb = new AWS.DynamoDB({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_DYNAMODB_URL,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });

    this.tableName = process.env.AWS_DYNAMODB_TABLE_NAME;
    this._initializeTable();
  }

  @CatchError(DynamoDBService.name)
  private async _initializeTable(): Promise<void> {
    const tables = await this.dynamoDb.listTables().promise();
    const tableExists = tables.TableNames?.some(table => table === this.tableName);

    if (!tableExists) {
      this.logger.info(`Table "${this.tableName}" not found. Creating...`);

      const params = {
        TableName: this.tableName,
        KeySchema: [{ AttributeName: 'Id', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'Id', AttributeType: 'S' },
          { AttributeName: 'name', AttributeType: 'S' },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        GlobalSecondaryIndexes: [
          {
            IndexName: 'NameIndex',
            KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
            Projection: {
              ProjectionType: 'ALL',
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        ],
      };

      await this.dynamoDb.createTable(params).promise();
      this.logger.info(`Table "${this.tableName}" has been created`);
    } else {
      this.logger.info(`Table "${this.tableName}" already exists.`);
    }
  }

  @CatchError(DynamoDBService.name)
  async createItem(
    name: string,
    size: number,
  ): Promise<{ Id: string; createdAt: string; name: string; size: number }> {
    const params = {
      TableName: this.tableName,
      Item: {
        Id: uuidv4(), // Generate a unique UUID for the item ID
        createdAt: new Date().toISOString(),
        name,
        size,
      },
    };

    await this.dynamoDbClient.put(params).promise();
    this.logger.info({ params }, 'Item created successfully in DynamoDB');
    return params.Item;
  }

  @CatchError(DynamoDBService.name)
  async getItemByName(name: string): Promise<DynamoDBItem> {
    const params = {
      TableName: this.tableName,
      IndexName: 'NameIndex',
      KeyConditionExpression: '#name = :name',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': name,
      },
    };

    const { Items } = await this.dynamoDbClient.query(params).promise();
    this.logger.info({ name }, 'Item retrieved successfully from DynamoDB');

    return Items[0] as DynamoDBItem;
  }

  @CatchError(DynamoDBService.name)
  async update(fileName: string, name: string, size: number): Promise<DynamoDBItem> {
    const item = await this.getItemByName(fileName);
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const params = {
      TableName: this.tableName,
      Key: { Id: item.Id },
      UpdateExpression: 'set #name = :name, size = :size',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': name,
        ':size': size,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await this.dynamoDbClient.update(params).promise();
    this.logger.info('Item updated successfully in DynamoDB');
    return this.getItemByName(name);
  }

  @CatchError(DynamoDBService.name)
  async delete(fileName: string): Promise<void> {
    const item = await this.getItemByName(fileName);

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const params = {
      TableName: this.tableName,
      Key: { Id: item.Id },
    };

    await this.dynamoDbClient.delete(params).promise();
    this.logger.info('Item deleted successfully from DynamoDB');
  }
}
