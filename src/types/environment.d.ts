export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DB_PASS: string;
      DB_USER: string;
      DB_CLUSTERNAME: string;
      JWT_SECRET: string;
      MAILAPI_KEY: string;
      MAILSECRET_KEY: string;
      NODE_ENV: "development" | "production";
    }
  }
}
