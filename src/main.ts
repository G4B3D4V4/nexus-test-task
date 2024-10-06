require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { enableApiDocs } from '@app/common';
import { ValidationPipe } from '@nestjs/common';

const globalPrefix = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ validateCustomDecorators: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  enableApiDocs(app, globalPrefix);

  await app.listen(process.env.API_PORT);
}
bootstrap();
