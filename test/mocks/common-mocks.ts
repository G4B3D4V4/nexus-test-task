export const mockFileBuffer = Buffer.from('mocked-file-content');

export const mockFileObj = {
  buffer: mockFileBuffer,
  originalname: 'mocked-name',
  size: 100,
};

export const mockDynamoDBItem = {
  Id: 'mocked-id',
  createdAt: '2021-09-01T00:00:00.000Z',
  name: 'mocked-name',
  size: 100,
};

export const mockSendData = {
  Location: 'mock-location',
  ETag: '"d41d8cd98f00b204e9800998ecf8427e"',
  Bucket: 'mock-bucket',
  Key: 'files/mock-key',
};

export const mockQueryOutput = {
  Items: [mockDynamoDBItem],
  Count: 1,
  ScannedCount: 1,
};
