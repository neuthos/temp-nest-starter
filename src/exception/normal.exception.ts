import { FailResponse, HttpFailResponse } from '@share/interfaces';
import { HttpException, HttpStatus } from '@nestjs/common';

export class NormalException extends HttpException {
  constructor(message: string, code: number) {
    super({ message, code }, HttpStatus.BAD_REQUEST);
  }

  static HTTP_REQUEST_TIMEOUT = () => {
    return new NormalException('HTTP Request Timeout', 408);
  };

  static VALIDATION_ERROR = (msg?: string) => {
    return new NormalException(msg || 'Validation Error', 400);
  };

  static UNEXPECTED = (msg?: string) => {
    return new NormalException(msg || 'Unexpected Error', 500);
  };

  static NOTFOUND = (msg?: string) => {
    return new NormalException(msg || 'Unexpected Error', 404);
  };

  toJSON(): HttpFailResponse {
    const response = this.getResponse();
    return {
      success: false,
      status: response.code,
      msg: response.message,
      data: null,
    };
  }

  // @Override
  getResponse(): FailResponse {
    return <FailResponse>super.getResponse();
  }
}
