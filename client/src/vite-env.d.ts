/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Add other VITE_ prefixed environment variables if any are used by the client
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
