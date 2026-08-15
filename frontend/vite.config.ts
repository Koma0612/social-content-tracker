import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 开发模式下，前端页面里所有 /api 开头的请求都转发给后端(4000端口)，
// 这样前端代码里不用写死 http://localhost:4000，浏览器也不会有跨域问题。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
