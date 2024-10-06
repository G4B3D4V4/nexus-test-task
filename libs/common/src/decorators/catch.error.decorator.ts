import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectPinoLogger } from 'nestjs-pino';

export function CatchError(className: string | undefined | null = null) {
  return function (target, propertyKey, descriptor) {
    className =
      __dirname.split('/').pop() + '_' + (className ? className : target.constructor.name);
    const injectLogger = InjectPinoLogger(className);

    injectLogger(target, 'logger');
    const method = descriptor.value;
    descriptor.value = function () {
      try {
        const result = method.apply(this, arguments);
        if (Boolean(result instanceof Promise)) {
          return result.catch(error => {
            if (process.env.NODE_ENV === 'development') {
              console.log('==== Caught error ==== \n', error, '\n======================');
            }

            if (!error?.status || error?.status >= 500) {
              try {
                this.logger.error(
                  { error: error.message ? error.message : error },
                  `Error in ${propertyKey} of ${className}`,
                );
              } catch (_) {}
            }
            if (error.code === 'ER_DUP_ENTRY') {
              throw new ConflictException(error.sqlMessage);
            }
            throw error.status ? error : new InternalServerErrorException();
          });
        }
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('==== Caught error ==== \n', error, '\n======================');
        }
        this.logger.error(
          { error: error.message ? error.message : error },
          `Error in ${propertyKey} of ${className}`,
        );
        if (error.code === 'ER_DUP_ENTRY') {
          throw new ConflictException(error.sqlMessage);
        }
        throw error.status ? error : new InternalServerErrorException();
      }
    };
  };
}
