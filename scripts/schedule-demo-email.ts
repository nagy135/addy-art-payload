import { getPayload } from 'payload'

import config from '../src/payload.config'

const payload = await getPayload({ config })

const userEmail = process.argv[2] || 'demo@example.com'
const waitUntil = new Date(Date.now() + 5 * 60 * 1000)

const job = await (payload.jobs.queue as any)({
  task: 'demoSendEmail',
  input: {
    userEmail,
  },
  // waitUntil,
})

payload.logger.info(
  `Queued demoSendEmail job ${job?.id} for ${userEmail} at ${waitUntil.toISOString()}`,
)

process.exit(0)
