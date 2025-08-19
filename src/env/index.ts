import 'dotenv/config'
import { z } from 'zod'

const envSchama = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string(),
  PORT: z.number().default(3333),
})

const _env = envSchama.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Invalid environment variables!')

  throw new Error('❌ Invalid environment variables!')
}

export const env = _env.data
