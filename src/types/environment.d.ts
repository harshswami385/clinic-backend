declare namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      FIREBASE_PROJECT_ID: string;
      FIREBASE_PRIVATE_KEY: string;
      FIREBASE_CLIENT_EMAIL: string;
    }
  }