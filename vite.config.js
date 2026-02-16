import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BUILD_FOR_PAGES ? '/knights-quest/' : '/',
});
