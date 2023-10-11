export interface HttpSuccessResponse<T> {
  readonly success: boolean;
  readonly status: number;
  readonly msg: string;
  readonly data: T;
}

export interface FailResponse {
  readonly message: string;
  readonly code: number;
}

export interface HttpFailResponse {
  readonly success: boolean;
  readonly status: number;
  readonly msg: string;
  readonly data: any;
}

export interface DataResponse {
  readonly message: string;
  readonly data: any;
}
