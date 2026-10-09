import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scheme from '../models/Scheme.js';

dotenv.config();

const schemes = [
  {
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    description: 'Direct income support of ₹6,000 per year to eligible farmer families across India, paid in three equal installments of ₹2,000 each.',
    category: 'AGRICULTURE',
    department: 'Ministry of Agriculture & Farmers Welfare',
    state: 'ALL',
    benefits: 'Annual financial support of ₹6,000 directly to bank accounts in three installments.',
    eligibilityRules: [
      { field: 'isFarmer', operator: 'eq', value: true },
      { field: 'annualFamilyIncome', operator: 'lte', value: 800000 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar number linked to bank account', mandatory: true },
      { name: 'Land Records', description: 'Proof of agricultural land ownership', mandatory: true },
      { name: 'Bank Account Details', description: 'Active bank account with IFSC code', mandatory: true },
    ],
    applicationProcess: 'Apply through CSC (Common Service Centre), state agriculture office, or online at pmkisan.gov.in.',
    officialUrl: 'https://pmkisan.gov.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Pradhan Mantri Awas Yojana – Gramin (PMAY-G)',
    description: 'Housing assistance for rural poor to construct pucca houses with basic amenities including toilet, LPG connection, electricity, and drinking water.',
    category: 'HOUSING',
    department: 'Ministry of Rural Development',
    state: 'ALL',
    benefits: '₹1.20 lakh in plain areas and ₹1.30 lakh in hilly/difficult areas for house construction.',
    eligibilityRules: [
      { field: 'residenceType', operator: 'eq', value: 'RURAL' },
      { field: 'annualFamilyIncome', operator: 'lte', value: 300000 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar for all family members', mandatory: true },
      { name: 'BPL Card / SECC Data', description: 'Proof of economic status', mandatory: true },
      { name: 'Bank Account', description: 'Active bank account', mandatory: true },
      { name: 'Land Documents', description: 'Proof of land for construction', mandatory: false },
    ],
    applicationProcess: 'Apply through Gram Panchayat or Block Development Office. Selection based on SECC data.',
    officialUrl: 'https://pmayg.nic.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'PM Ujjwala Yojana',
    description: 'Free LPG connections to women from Below Poverty Line (BPL) households to provide clean cooking fuel and improve health outcomes.',
    category: 'SOCIAL_WELFARE',
    department: 'Ministry of Petroleum & Natural Gas',
    state: 'ALL',
    benefits: 'Free LPG connection with deposit-free cylinder, regulator, and first refill.',
    eligibilityRules: [
      { field: 'gender', operator: 'eq', value: 'FEMALE' },
      { field: 'annualFamilyIncome', operator: 'lte', value: 250000 },
      { field: 'age', operator: 'gte', value: 18 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Aadhaar of applicant (woman)', mandatory: true },
      { name: 'BPL Certificate', description: 'Below Poverty Line card or ration card', mandatory: true },
      { name: 'Bank Account', description: 'Jan Dhan or savings account', mandatory: true },
    ],
    applicationProcess: 'Apply through nearest LPG distributor with required documents.',
    officialUrl: 'https://www.pmujjwalayojana.com',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'National Scholarship Portal (NSP)',
    description: 'Centralized platform for scholarships offered by Central and State governments for students from pre-matric to post-doctoral levels.',
    category: 'EDUCATION',
    department: 'Ministry of Electronics & IT',
    state: 'ALL',
    benefits: 'Scholarship amounts varying from ₹1,000 to ₹50,000+ per year depending on the specific scholarship.',
    eligibilityRules: [
      { field: 'isStudent', operator: 'eq', value: true },
      { field: 'annualFamilyIncome', operator: 'lte', value: 600000 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar number', mandatory: true },
      { name: 'Income Certificate', description: 'Family income certificate from competent authority', mandatory: true },
      { name: 'Caste Certificate', description: 'For SC/ST/OBC candidates', mandatory: false },
      { name: 'Bonafide Certificate', description: 'From educational institution', mandatory: true },
      { name: 'Bank Account', description: 'Student bank account', mandatory: true },
    ],
    applicationProcess: 'Apply online at scholarships.gov.in during the open application window.',
    officialUrl: 'https://scholarships.gov.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Ayushman Bharat – Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    description: 'Health insurance coverage of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    category: 'HEALTHCARE',
    department: 'Ministry of Health & Family Welfare',
    state: 'ALL',
    benefits: '₹5 lakh annual health insurance cover per family, cashless treatment at empaneled hospitals.',
    eligibilityRules: [
      { field: 'annualFamilyIncome', operator: 'lte', value: 300000 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar for all family members', mandatory: true },
      { name: 'Ration Card', description: 'BPL ration card or SECC inclusion', mandatory: true },
      { name: 'RSBY Card', description: 'If previously enrolled in RSBY', mandatory: false },
    ],
    applicationProcess: 'Visit the nearest CSC or Ayushman Mitra at empaneled hospitals for registration.',
    officialUrl: 'https://pmjay.gov.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)',
    description: 'Guarantees 100 days of wage employment per year to every rural household whose adult members volunteer to do unskilled manual work.',
    category: 'EMPLOYMENT',
    department: 'Ministry of Rural Development',
    state: 'ALL',
    benefits: '100 days guaranteed employment per household. State-specific wage rates (₹200-₹350 per day).',
    eligibilityRules: [
      { field: 'residenceType', operator: 'eq', value: 'RURAL' },
      { field: 'age', operator: 'gte', value: 18 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar', mandatory: true },
      { name: 'Job Card', description: 'MGNREGA Job Card (issued upon registration)', mandatory: true },
      { name: 'Bank/Post Office Account', description: 'For wage payment', mandatory: true },
    ],
    applicationProcess: 'Apply at the Gram Panchayat for a Job Card. Demand work in writing.',
    officialUrl: 'https://nrega.nic.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    description: 'Collateral-free loans up to ₹10 lakh for micro and small enterprises under Shishu, Kishore, and Tarun categories.',
    category: 'FINANCIAL_INCLUSION',
    department: 'Ministry of Finance',
    state: 'ALL',
    benefits: 'Loans: Shishu (up to ₹50K), Kishore (₹50K–₹5L), Tarun (₹5L–₹10L). No collateral required.',
    eligibilityRules: [
      { field: 'age', operator: 'gte', value: 18 },
      { field: 'occupation', operator: 'in', value: ['SELF_EMPLOYED', 'BUSINESS', 'ENTREPRENEUR', 'FARMER'] },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Identity proof', mandatory: true },
      { name: 'Business Plan', description: 'Brief plan of the proposed business', mandatory: true },
      { name: 'Address Proof', description: 'Utility bill or rental agreement', mandatory: true },
      { name: 'Bank Statements', description: 'Last 6 months if existing business', mandatory: false },
    ],
    applicationProcess: 'Apply at any bank, NBFC, or MFI. Also available through udyamimitra.in.',
    officialUrl: 'https://www.mudra.org.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Kisan Credit Card (KCC)',
    description: 'Provides timely and adequate credit to farmers for crop production, post-harvest, and personal consumption needs at subsidized interest rates.',
    category: 'AGRICULTURE',
    department: 'Ministry of Agriculture & Farmers Welfare',
    state: 'ALL',
    benefits: 'Credit at 4% interest (after subsidy). Crop insurance included. Flexible repayment.',
    eligibilityRules: [
      { field: 'isFarmer', operator: 'eq', value: true },
      { field: 'age', operator: 'gte', value: 18 },
      { field: 'age', operator: 'lte', value: 75 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Identity and address proof', mandatory: true },
      { name: 'Land Records', description: 'Proof of land ownership or tenancy', mandatory: true },
      { name: 'Passport Photo', description: 'Recent photograph', mandatory: true },
    ],
    applicationProcess: 'Apply at nearest bank branch (commercial bank, cooperative, or regional rural bank).',
    officialUrl: 'https://pmkisan.gov.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Ladli Behna Yojana (Madhya Pradesh)',
    description: 'Monthly financial assistance to women of Madhya Pradesh aged 21-60 from economically weaker sections.',
    category: 'WOMEN_EMPOWERMENT',
    department: 'Department of Women & Child Development, MP',
    state: 'Madhya Pradesh',
    benefits: '₹1,250 per month transferred directly to beneficiary bank account.',
    eligibilityRules: [
      { field: 'gender', operator: 'eq', value: 'FEMALE' },
      { field: 'state', operator: 'eq', value: 'Madhya Pradesh' },
      { field: 'age', operator: 'gte', value: 21 },
      { field: 'age', operator: 'lte', value: 60 },
      { field: 'annualFamilyIncome', operator: 'lte', value: 250000 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar', mandatory: true },
      { name: 'Samagra ID', description: 'Samagra/family ID of Madhya Pradesh', mandatory: true },
      { name: 'Bank Account', description: 'DBT-linked bank account', mandatory: true },
    ],
    applicationProcess: 'Apply at nearest Gram Panchayat/Ward office or camp. Online at cmladlibahna.mp.gov.in.',
    officialUrl: 'https://cmladlibahna.mp.gov.in',
    sourceType: 'OFFICIAL',
  },
  {
    name: 'Atal Pension Yojana (APY)',
    description: 'Guaranteed pension scheme for workers in the unorganized sector, providing fixed monthly pension of ₹1,000 to ₹5,000 after age 60.',
    category: 'PENSION',
    department: 'Department of Financial Services',
    state: 'ALL',
    benefits: 'Monthly pension of ₹1,000–₹5,000 after 60. Government co-contributes 50% for eligible subscribers.',
    eligibilityRules: [
      { field: 'age', operator: 'gte', value: 18 },
      { field: 'age', operator: 'lte', value: 40 },
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', description: 'Valid Aadhaar', mandatory: true },
      { name: 'Bank Account', description: 'Savings bank account', mandatory: true },
      { name: 'Mobile Number', description: 'Active mobile number', mandatory: true },
    ],
    applicationProcess: 'Apply at any bank branch or online through net banking. Auto-debit from savings account.',
    officialUrl: 'https://www.npscra.nsdl.co.in/scheme-details.php',
    sourceType: 'OFFICIAL',
  },
];

export const seedSchemes = schemes.map((s, index) => ({
  ...s,
  _id: s._id || `65f00000000000000000000${(index + 1).toString(16).padStart(2, '0')}`,
  isActive: true,
}));

export default seedSchemes;

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sevaconnect';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing schemes
    await Scheme.deleteMany({});
    console.log('Cleared existing schemes.');

    // Insert new schemes
    const created = await Scheme.insertMany(seedSchemes);
    console.log(`Seeded ${created.length} government schemes.`);

    await mongoose.disconnect();
    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

// Only run automatically when executed directly from CLI
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('seed/schemes.js')) {
  seed();
}
