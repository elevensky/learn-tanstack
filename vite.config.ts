import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    // Vite 8 supports tsconfig paths natively at runtime.
    // @ts-expect-error pending type support in current tooling.
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tanstackRouter(),
    tailwindcss(),
    viteReact(),
  ],
})

export default config
