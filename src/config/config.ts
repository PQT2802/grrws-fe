const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  },
  auth: {
    tokenStorageKey: "auth_token",
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "GRRWS",
  },
};

export default config;
