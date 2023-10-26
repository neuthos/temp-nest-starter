/* eslint-disable max-classes-per-file */
// http-request.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { NormalException } from '@/exception';

export class HttpResponseDto<T> {
  data: any;

  status: number;

  request: any;
}

@Injectable()
export class HttpRequestService {
  private readonly logger = new Logger(HttpRequestService.name);

  constructor(private httpService: HttpService) {}

  async get<T>(
    url: string,
    params?: any,
    headers?: any
  ): Promise<HttpResponseDto<T>> {
    const request = await this.httpService.axiosRef.get(url, {
      params,
      headers,
    });
    const response = request.data;

    return {
      data: response as T,
      status: response.status,
      request: { url, params },
    };
  }

  async post<T>(
    url: string,
    data: any,
    headers: any
  ): Promise<HttpResponseDto<T>> {
    try {
      const request = await this.httpService.axiosRef.post(url, data, {
        headers,
      });
      const response = request.data;

      return {
        data: response as T,
        status: response.status,
        request: { url, data },
      };
    } catch (error) {
      const response = error?.response?.data || null;
      if (!response) {
        this.logger.error(error);
        throw NormalException.UNEXPECTED('Internal Server Error');
      }
      this.logger.error(response);
      throw NormalException.UNEXPECTED(response?.msg);
    }
  }

  // Add other HTTP methods (put, patch, delete, etc.) as needed
}
