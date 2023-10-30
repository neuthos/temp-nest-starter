/* eslint-disable max-classes-per-file */
// http-request.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

export class HttpResponseDto<T> {
  success: boolean;

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
    try {
      const request = await this.httpService.axiosRef.get(url, {
        params,
        headers,
      });

      const response = request.data;

      return {
        success: true,
        data: response as T,
        status: response.status,
        request: { url, params },
      };
    } catch (error) {
      const response = error?.response?.data || null;
      if (!response) this.logger.error(error);
      else this.logger.error(response);

      return {
        success: false,
        data: response,
        status: response?.status || 500,
        request: { url },
      };
    }
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
        success: true,
        data: response as T,
        status: response.status,
        request: { url, data },
      };
    } catch (error) {
      const response = error?.response?.data || null;

      if (!response) this.logger.error(error);
      else this.logger.error(response);

      return {
        success: false,
        data: response,
        status: response?.status || 500,
        request: { url, data },
      };
    }
  }

  async patch<T>(
    url: string,
    data: any,
    headers: any
  ): Promise<HttpResponseDto<T>> {
    try {
      const request = await this.httpService.axiosRef.patch(url, data, {
        headers,
      });

      const response = request.data;

      return {
        success: true,
        data: response as T,
        status: response.status,
        request: { url, data },
      };
    } catch (error) {
      const response = error?.response?.data || null;

      if (!response) this.logger.error(error);
      else this.logger.error(response);

      return {
        success: false,
        data: response,
        status: response?.status || 500,
        request: { url, data },
      };
    }
  }

  // Add other HTTP methods (put, patch, delete, etc.) as needed
}
