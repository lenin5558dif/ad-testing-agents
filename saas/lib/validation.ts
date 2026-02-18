import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  niche: z.string().min(1).max(500),
})

export const createOfferSchema = z.object({
  headline: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  callToAction: z.string().max(200).optional(),
  price: z.string().max(50).optional(),
  strategyType: z.string().max(100).optional(),
})

export const createPersonaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(300),
  ageGroup: z.enum(['18-23', '24-29', '30-39', '40-54', '55+']),
  incomeLevel: z.enum(['low', 'medium', 'high', 'luxury']),
  occupation: z.string().min(1).max(100),
  personalityTraits: z.array(z.string().max(50)).min(1).max(5),
  values: z.array(z.string().max(100)).min(1).max(5),
  painPoints: z.array(z.string().max(200)).min(1).max(5),
  goals: z.array(z.string().max(200)).min(1).max(5),
  triggersPositive: z.string().max(1000),
  triggersNegative: z.string().max(1000),
  decisionFactors: z.array(z.string().max(200)).min(1).max(5),
  backgroundStory: z.string().max(2000),
})
