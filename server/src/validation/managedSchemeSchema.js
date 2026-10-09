import { z } from 'zod';

const eligibilityRule = z.object({
  field: z.string().min(1).max(80),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'exists']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.record(z.string(), z.unknown())]),
}).strict();

const requiredDocument = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(500).default(''),
  mandatory: z.boolean().default(true),
}).strict();

export const managedSchemeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  displayName: z.string().trim().min(1).max(160),
  category: z.enum(['AGRICULTURE', 'EDUCATION', 'HEALTHCARE', 'HOUSING', 'EMPLOYMENT', 'ENERGY', 'SOCIAL_WELFARE', 'WOMEN_EMPOWERMENT', 'FINANCIAL_INCLUSION', 'PENSION', 'INSURANCE', 'SKILL_DEVELOPMENT', 'OTHER']),
  cardCategory: z.string().trim().min(1).max(80),
  audience: z.string().trim().min(1).max(240),
  cardDescription: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(5000),
  department: z.string().max(200).default(''),
  state: z.string().max(100).default('ALL'),
  benefits: z.string().max(3000).default(''),
  eligibilityRules: z.array(eligibilityRule).default([]),
  requiredDocuments: z.array(requiredDocument).default([]),
  applicationProcess: z.string().max(5000).default(''),
  officialUrl: z.string().url().max(1000),
  sourceType: z.enum(['OFFICIAL', 'VERIFIED', 'UNVERIFIED']).default('UNVERIFIED'),
  isActive: z.boolean().default(true),
}).strict();