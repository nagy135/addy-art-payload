import type { Endpoint, TaskConfig } from 'payload'

type DemoSendEmailJob = {
  input: {
    userEmail: string
  }
  output: {
    processedAt: string
    userEmail: string
  }
}

const fiveMinutesInMs = 5 * 60 * 1000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const demoSendEmailTask: TaskConfig<DemoSendEmailJob> = {
  slug: 'demoSendEmail',
  label: 'Demo send email',
  inputSchema: [
    {
      name: 'userEmail',
      type: 'email',
      required: true,
    },
  ],
  outputSchema: [
    {
      name: 'userEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
    },
  ],
  handler: async ({ input, req }) => {
    req.payload.logger.info(`[jobs] demoSendEmail started for ${input.userEmail}`)

    await sleep(fiveMinutesInMs)

    req.payload.logger.info(`[jobs] demoSendEmail finished for ${input.userEmail}`)

    return {
      output: {
        processedAt: new Date().toISOString(),
        userEmail: input.userEmail,
      },
    }
  },
}

export const scheduleDemoSendEmailEndpoint: Endpoint = {
  path: '/demo-email-jobs/schedule',
  method: 'post',
  handler: async (req) => {
    if (!req.user?.email) {
      return Response.json(
        { error: 'You must be logged in to schedule this demo job.' },
        { status: 401 },
      )
    }

    const waitUntil = new Date(Date.now() + fiveMinutesInMs)
    const job = await (req.payload.jobs.queue as any)({
      task: 'demoSendEmail',
      input: {
        userEmail: req.user.email,
      },
      waitUntil,
    })

    return Response.json({
      jobID: job?.id,
      message: `Scheduled a demo email job for ${req.user.email}.`,
      note: 'This project only schedules the job. Run the Payload job worker separately when you want to process it.',
      scheduledFor: waitUntil.toISOString(),
    })
  },
}
