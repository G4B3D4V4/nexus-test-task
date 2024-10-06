import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const enableApiDocs = (app: INestApplication, globalPrefix: string): void => {
  const docsUIEnabled: boolean = process.env.DOCS_UI_ENABLED ? true : false;

  if (!docsUIEnabled) return;

  const options = new DocumentBuilder()
    .setTitle('Nexus test Back-end')
    .setDescription('Nexus test task Back-end API')
    .setVersion('1.0')
    .addTag('Back-End API')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt-token')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup(globalPrefix ? `/${globalPrefix}` : '', app, document);
};
