import * as packageJSON from 'package.json';
import { Injectable } from '@nestjs/common';
import { VersionRes } from './dto';

@Injectable()
export class AppService {
  public getVersion(): VersionRes {
    return { version: packageJSON.version };
  }

  public healthz(): string {
    return 'OK';
  }

  public companyRegistration() {
    // todo: find all users from service users by compnay id
    // todo: create program simpanan pokok
    // todo: create program simpanan wajib
  }
}
