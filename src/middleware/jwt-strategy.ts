/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Issuer, custom } from 'openid-client';
import { NextFunction, Request, Response } from 'express';

interface JwtPayload {
  sub: string;
  resource_access: { [key: string]: any };
  email_verified: boolean;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  name: string;
  koperasi_guid: string;
  companyId: string;
}

@Injectable()
export class KoperasiMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const { branch_guid, authorization } = req.headers;
    const authHeader = authorization;

    if (
      req.headers &&
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = authHeader.split(' ')[1];

      try {
        const discovery = await Issuer.discover(
          `${process.env.KOPERASI_AUTH_SERVICE_URL}/realms/koperasi`
        );

        const clientOidc = new discovery.Client({
          client_id: process.env.KOPERASI_AUTH_SERVICE_CLIENT_ID,
          client_secret: process.env.KOPERASI_AUTH_SERVICE_CLIENT_SECRET,
        });

        clientOidc[custom.clock_tolerance] = 10;
        const userInfo: JwtPayload = await clientOidc.userinfo(token);

        req.headers.koperasi_guid = userInfo.koperasi_guid;
        req.headers.companyId = userInfo.companyId;
        req.headers.user_guid = userInfo.sub;
        req.headers.branch_guid = branch_guid;
        req.headers.access_token = token;
        req.headers.user_name = userInfo.name;
        req.headers.user_email = userInfo.email;
      } catch (err) {
        return res.status(401).json({
          success: false,
          status: 401,
          isTokenUnavailable: true,
          msg: 'Invalid Credential',
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        status: 401,
        isTokenUnavailable: true,
        msg: 'Access Token Required',
      });
    }
    next();
  }
}
