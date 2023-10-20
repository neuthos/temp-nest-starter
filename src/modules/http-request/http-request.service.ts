/* eslint-disable max-classes-per-file */
// http-request.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

export class HttpResponseDto<T> {
  data: any;

  status: number;

  request: any;
}

@Injectable()
export class HttpRequestService {
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
    const request = await this.httpService.axiosRef.post(url, data, {
      headers,
    });

    const response = request.data;

    return {
      data: response as T,
      status: response.status,
      request: { url, data },
    };
  }

  // Add other HTTP methods (put, patch, delete, etc.) as needed
}
