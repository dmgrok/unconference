// Nitro configuration for Prisma deployment
import type { NitroConfig } from 'nitropack'

const config: NitroConfig = {
  // Let Vercel handle Prisma as external dependency
  externals: {
    inline: []
  },
  // Ensure Prisma is treated as having side effects
  moduleSideEffects: ['@prisma/client'],
  experimental: {
    wasm: true
  }
}

export default config
