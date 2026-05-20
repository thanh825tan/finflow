import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Đổi 'finflow' nếu repo có tên khác
export default defineConfig({
  base: '/finflow/',
  plugins: [react()],
})
