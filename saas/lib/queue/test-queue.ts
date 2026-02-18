import { Queue } from 'bullmq'
import { redisConnection } from './connection'

export interface EvaluationJobData {
  personaResponseId: string
  testRunId: string
}

export const testQueue = new Queue<EvaluationJobData>('test-evaluation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
})
