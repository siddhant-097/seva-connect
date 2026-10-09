import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { z } from 'zod';
import env from '../config/env.js';
import Scheme from '../models/Scheme.js';

const categories = ['AGRICULTURE', 'EDUCATION', 'HEALTHCARE', 'HOUSING', 'EMPLOYMENT', 'ENERGY', 'SOCIAL_WELFARE', 'WOMEN_EMPOWERMENT', 'FINANCIAL_INCLUSION', 'PENSION', 'INSURANCE', 'SKILL_DEVELOPMENT', 'OTHER'];
const eligibilityRule = z.object({
  field: z.string().min(1).max(80),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'between', 'exists']),
  value: z.unknown(),
}).strict();
const documentSchema = z.object({ name: z.string().min(1).max(160), description: z.string().max(500).default(''), mandatory: z.boolean().default(true) }).strict();
const importSchema = z.object({
  name: z.string().trim().min(1).max(300),
  slug: z.string().trim().max(200).optional(),
  displayName: z.string().trim().max(160).optional(),
  description: z.string().trim().min(1).max(5000),
  category: z.enum(categories),
  cardCategory: z.string().trim().max(80).optional(),
  audience: z.string().trim().max(240).optional(),
  cardDescription: z.string().trim().max(500).optional(),
  department: z.string().max(200).optional(),
  state: z.string().trim().min(1).max(100).default('ALL'),
  benefits: z.string().max(3000).optional(),
  tags: z.array(z.string().max(120)).optional(),
  eligibilityText: z.string().max(10000).optional(),
  exclusionsText: z.string().max(5000).optional(),
  documentsText: z.string().max(5000).optional(),
  faqText: z.string().max(5000).optional(),
  applicationMode: z.string().max(300).optional(),
  eligibilityRules: z.array(eligibilityRule).optional(),
  requiredDocuments: z.array(documentSchema).optional(),
  applicationProcess: z.string().max(5000).optional(),
  officialUrl: z.string().url().max(1000),
  sourceUrl: z.string().url().max(1000).optional(),
  dataSource: z.string().max(200).optional(),
  dataSourceUrl: z.string().url().max(1000).optional(),
  sourceType: z.enum(['OFFICIAL', 'VERIFIED', 'UNVERIFIED']).default('UNVERIFIED'),
  lastVerified: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(false),
}).strict().refine((record) => !record.isActive || record.sourceType !== 'UNVERIFIED' || record.dataSourceUrl === 'https://github.com/Aryan-Pardeshi/gov-myscheme-dataset', {
  message: 'Only records from the designated study dataset may be published while unverified.',
  path: ['isActive'],
});

function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function validWebUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function categoryFromTags(value = '') {
  const tags = value.toLowerCase();
  if (/agri|farm|crop|dairy|fish|horticulture/.test(tags)) return 'AGRICULTURE';
  if (/education|school|student|scholarship|university|academic/.test(tags)) return 'EDUCATION';
  if (/health|medical|hospital|disease|maternity/.test(tags)) return 'HEALTHCARE';
  if (/housing|house|home|shelter/.test(tags)) return 'HOUSING';
  if (/skill|employment|worker|labour|labor|entrepreneur|business/.test(tags)) return 'EMPLOYMENT';
  if (/energy|electricity|solar|power/.test(tags)) return 'ENERGY';
  if (/women|girl|widow|child|mothers/.test(tags)) return 'WOMEN_EMPOWERMENT';
  if (/pension|old age/.test(tags)) return 'PENSION';
  if (/insurance|bima/.test(tags)) return 'INSURANCE';
  if (/bank|financial|loan|credit|subsidy/.test(tags)) return 'FINANCIAL_INCLUSION';
  return 'OTHER';
}

function fromCommunityDataset(record) {
  if (!record || typeof record !== 'object' || !record['Scheme Name']) return record;
  const schemePage = validWebUrl(record['MyScheme URL']);
  const linkedPage = validWebUrl(record['Official Link']);
  const central = record.Level === 'Central Government';
  const place = String(record['State / UT / Ministry'] || '').trim();
  const name = String(record['Scheme Name']).trim();
  return {
    name,
    displayName: name.slice(0, 160),
    description: String(record.Description || name).slice(0, 5000),
    category: categoryFromTags(record['Tags / Categories']),
    state: central || !place ? 'ALL' : place,
    department: central ? place : '',
    cardCategory: categoryFromTags(record['Tags / Categories']).replaceAll('_', ' '),
    audience: 'See the official source for eligibility details',
    cardDescription: String(record.Description || name).slice(0, 500),
    benefits: String(record.Benefits || '').slice(0, 3000),
    tags: String(record['Tags / Categories'] || '').split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 30),
    eligibilityText: [record['Eligibility Criteria'], record['Eligibility (General)']].filter(Boolean).join('\n\n').slice(0, 10000),
    exclusionsText: String(record['Exclusions / Ineligibility'] || '').slice(0, 5000),
    documentsText: String(record['Documents Required'] || '').slice(0, 5000),
    faqText: String(record['Frequently Asked Questions (FAQs)'] || '').slice(0, 5000),
    applicationMode: String(record['Application Mode'] || '').slice(0, 300),
    applicationProcess: String(record['Application Process'] || '').slice(0, 5000),
    eligibilityRules: [],
    requiredDocuments: [],
    officialUrl: linkedPage || schemePage,
    sourceUrl: schemePage || linkedPage,
    dataSource: 'Community JSON dataset derived from myScheme; not independently verified',
    dataSourceUrl: 'https://github.com/Aryan-Pardeshi/gov-myscheme-dataset',
    sourceType: 'UNVERIFIED',
    lastVerified: null,
    isActive: true,
    slug: slugify(record['Scheme Slug'] || name),
  };
}

function argsFrom(argv) {
  const result = { apply: false, updateExisting: false, file: '' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--apply' || argv[i] === 'apply') result.apply = true;
    else if (argv[i] === '--update-existing' || argv[i] === 'update-existing') result.updateExisting = true;
    else if (argv[i] === '--file') result.file = argv[++i] || '';
    else if (!argv[i].startsWith('-') && !result.file) result.file = argv[i];
  }
  return result;
}

async function main() {
  const options = argsFrom(process.argv.slice(2));
  if (!options.file) throw new Error('Usage: npm run import:schemes --workspace server -- <path-to-json> [--apply] [--update-existing]');

  const filePath = path.resolve(process.cwd(), options.file);
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('Import file must contain a non-empty JSON array of scheme records.');

  const parsed = raw.map((rawRecord, index) => {
    const record = fromCommunityDataset(rawRecord);
    const result = importSchema.safeParse(record);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      throw new Error(`Record ${index + 1} is invalid: ${issues}`);
    }
    const fields = result.data;
    const slug = slugify(fields.slug || fields.displayName || fields.name);
    if (!slug) throw new Error(`Record ${index + 1} has no usable English name for a stable slug.`);
    return {
      ...fields,
      slug,
      displayName: fields.displayName || fields.name,
      cardCategory: fields.cardCategory || fields.category.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
      audience: fields.audience || 'See the official source for eligibility details',
      cardDescription: fields.cardDescription || fields.description,
      department: fields.department || '',
      benefits: fields.benefits || '',
      eligibilityRules: fields.eligibilityRules || [],
      requiredDocuments: fields.requiredDocuments || [],
      applicationProcess: fields.applicationProcess || '',
      sourceUrl: fields.sourceUrl || fields.officialUrl,
      lastVerified: fields.lastVerified || null,
      displayOrder: 1,
    };
  });

  const slugs = new Set();
  for (const record of parsed) {
    if (slugs.has(record.slug)) throw new Error(`Duplicate slug in import file: ${record.slug}`);
    slugs.add(record.slug);
  }

  if (!options.apply) {
    console.log(`Dry run passed: ${parsed.length} valid records, ${slugs.size} unique slugs.`);
    console.log('No database changes made. Add --apply to import these records. New records are inactive until reviewed.');
    return;
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected. Writing validated records in batches…');
  try {
    const max = await Scheme.findOne({}).sort({ displayOrder: -1 }).select('displayOrder').lean();
    let nextDisplayOrder = (max?.displayOrder || 0) + 1;
    const existingRecords = await Scheme.find({ slug: { $in: parsed.map((record) => record.slug) } }).select('slug dataSourceUrl').lean();
    const existingBySlug = new Map(existingRecords.map((record) => [record.slug, record]));
    const skipped = parsed.filter((record) => {
      const existing = existingBySlug.get(record.slug);
      return existing && (!options.updateExisting || existing.dataSourceUrl !== record.dataSourceUrl);
    }).length;
    const operations = parsed.flatMap((record) => {
      const existing = existingBySlug.get(record.slug);
      const exists = Boolean(existing);
      if (exists && (!options.updateExisting || existing.dataSourceUrl !== record.dataSourceUrl)) return [];
      const payload = { ...record };
      if (!exists) payload.displayOrder = nextDisplayOrder++;
      else delete payload.displayOrder;
      return [{
        updateOne: {
          filter: { slug: record.slug },
          update: exists ? { $set: payload } : { $setOnInsert: payload },
          upsert: true,
        },
      }];
    });
    let inserted = 0;
    let updated = 0;
    for (let offset = 0; offset < operations.length; offset += 250) {
      const result = await Scheme.bulkWrite(operations.slice(offset, offset + 250), { ordered: false });
      inserted += result.upsertedCount || 0;
      updated += result.modifiedCount || result.matchedCount || 0;
      console.log(`Processed ${Math.min(offset + 250, operations.length)} of ${operations.length} write operations.`);
    }
    console.log(`Import complete: ${inserted} inserted, ${updated} updated, ${skipped} already existed and were skipped.`);
    console.log('Community dataset records are published as unverified listings; verify details against the linked source.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`Scheme import failed: ${error.message}`);
  process.exitCode = 1;
});
