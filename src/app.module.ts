import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { v4 as uuidv4 } from 'uuid';
import { LoggerModule } from 'nestjs-pino';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: ['req.headers.cookie', 'res.headers["set-cookie"]'],
        genReqId: () => uuidv4(),
        ...(Boolean(process.env.WRITE_LOGS_IN_FILE)
          ? {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  destination: './app-loggs.log',
                },
              },
            }
          : {}),
      },
    }),
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
