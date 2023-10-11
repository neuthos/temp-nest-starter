declare namespace NodeJS {
  interface ProcessEnv {
    BASE_PATH?: string;
    CLUSTERING: string;
    LOG_LEVEL?: string;
    NODE_ENV: string;
    PORT: string;

    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;

    RABBITMQ_URL: string;
  }
}
