import mongoose from 'mongoose';
import env from '../config/env.js';
import Scheme from '../models/Scheme.js';


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

const detailedCardIds = [
  'pm-kisan', 'pmay-gramin', 'pm-ujjwala', 'scholarships', 'pm-jay',
  'mgnrega', 'mudra', 'kcc', 'ladli-behna', 'atal-pension',
];
const detailedSchemesByCardId = Object.fromEntries(
  detailedCardIds.map((id, index) => [id, schemes[index]])
);
const previousIdsByCardId = Object.fromEntries(
  detailedCardIds.map((id, index) => [id, `65f0000000000000000000${(index + 1).toString(16).padStart(2, '0')}`])
);

// This is the catalogue shown by the website. Existing detailed records above are
// retained and joined by card id; new cards start without inferred eligibility rules.
const schemeCards = [
  { id: 'pm-kisan', displayName: 'PM-KISAN', cardCategory: 'Agriculture', category: 'AGRICULTURE', audience: 'For eligible farmer families', description: 'Explore income support for eligible landholding farmer families.', officialUrl: 'https://pmkisan.gov.in/' },
  { id: 'pm-jay', displayName: 'Ayushman Bharat PM-JAY', cardCategory: 'Health', category: 'HEALTHCARE', audience: 'For eligible families', description: 'Understand health coverage options and how to check your eligibility.', officialUrl: 'https://pmjay.gov.in/' },
  { id: 'pmay-urban', displayName: 'PM Awas Yojana (Urban)', cardCategory: 'Housing', category: 'HOUSING', audience: 'For eligible urban households', description: 'Review housing assistance information and the official application route.', officialUrl: 'https://pmay-urban.gov.in/' },
  { id: 'scholarships', displayName: 'National Scholarship Portal', cardCategory: 'Education', category: 'EDUCATION', audience: 'For students across India', description: 'Find scholarship programs and prepare for an application.', officialUrl: 'https://scholarships.gov.in/' },
  { id: 'pm-ujjwala', displayName: 'PM Ujjwala Yojana', cardCategory: 'Social welfare', category: 'SOCIAL_WELFARE', audience: 'For eligible women in low-income households', description: 'Explore support for a clean cooking fuel connection and find the official application route.', officialUrl: 'https://www.pmuy.gov.in/' },
  { id: 'mgnrega', displayName: 'Mahatma Gandhi NREGA', cardCategory: 'Employment', category: 'EMPLOYMENT', audience: 'For rural households seeking wage employment', description: 'Learn about the rural employment guarantee and how to request work through your Gram Panchayat.', officialUrl: 'https://nrega.nic.in/' },
  { id: 'mudra', displayName: 'Pradhan Mantri MUDRA Yojana', cardCategory: 'Business', category: 'FINANCIAL_INCLUSION', audience: 'For micro and small business owners', description: 'Review loan options for starting or growing a small business.', officialUrl: 'https://www.mudra.org.in/' },
  { id: 'kcc', displayName: 'Kisan Credit Card', cardCategory: 'Agriculture', category: 'AGRICULTURE', audience: 'For farmers and agricultural workers', description: 'Find information about flexible credit for farming and related needs.', officialUrl: 'https://www.myscheme.gov.in/schemes/kcc' },
  { id: 'ladli-behna', displayName: 'Ladli Behna Yojana', cardCategory: 'Women', category: 'WOMEN_EMPOWERMENT', audience: 'For eligible women in Madhya Pradesh', description: 'Check the state program information and its current application guidance.', officialUrl: 'https://cmladlibahna.mp.gov.in/' },
  { id: 'atal-pension', displayName: 'Atal Pension Yojana', cardCategory: 'Pension', category: 'PENSION', audience: 'For eligible subscribers aged 18 to 40', description: 'Understand the contributory pension scheme and how to enroll through a bank.', officialUrl: 'https://www.npscra.nsdl.co.in/scheme-details.php' },
  { id: 'pm-surya-ghar', displayName: 'PM Surya Ghar: Muft Bijli Yojana', cardCategory: 'Energy', category: 'ENERGY', audience: 'For residential electricity consumers', description: 'Explore rooftop solar support and the official national portal.', officialUrl: 'https://pmsuryaghar.gov.in/' },
  { id: 'sukanya-samriddhi', displayName: 'Sukanya Samriddhi Account', cardCategory: 'Savings', category: 'FINANCIAL_INCLUSION', audience: 'For guardians of a girl child', description: 'Learn about this small savings scheme and account opening through banks or post offices.', officialUrl: 'https://www.indiapost.gov.in/' },
  { id: 'pm-vishwakarma', displayName: 'PM Vishwakarma', cardCategory: 'Skills', category: 'SKILL_DEVELOPMENT', audience: 'For traditional artisans and craftspeople', description: 'See support options for skills, tools, and credit for traditional trades.', officialUrl: 'https://pmvishwakarma.gov.in/' },
  { id: 'pmay-gramin', displayName: 'PM Awas Yojana (Gramin)', cardCategory: 'Housing', category: 'HOUSING', audience: 'For eligible rural households', description: 'Review rural housing assistance information and where to check beneficiary details.', officialUrl: 'https://pmayg.nic.in/' },
  { id: 'pmfby', displayName: 'Pradhan Mantri Fasal Bima Yojana', cardCategory: 'Agriculture', category: 'AGRICULTURE', audience: 'For farmers growing notified crops', description: 'Find crop insurance information and the official enrollment portal.', officialUrl: 'https://pmfby.gov.in/' },
  { id: 'jan-dhan', displayName: 'Pradhan Mantri Jan Dhan Yojana', cardCategory: 'Banking', category: 'FINANCIAL_INCLUSION', audience: 'For people seeking access to banking services', description: 'Learn about basic bank accounts and financial inclusion services.', officialUrl: 'https://pmjdy.gov.in/' },
  { id: 'stand-up-india', displayName: 'Stand-Up India', cardCategory: 'Business', category: 'FINANCIAL_INCLUSION', audience: 'For women and SC/ST entrepreneurs', description: 'Explore bank loan support for setting up a greenfield enterprise.', officialUrl: 'https://www.standupmitra.in/' },
  { id: 'pm-shram-yogi', displayName: 'PM Shram Yogi Maandhan', cardCategory: 'Pension', category: 'PENSION', audience: 'For eligible workers in the unorganized sector', description: 'Review the voluntary contributory pension scheme and enrollment options.', officialUrl: 'https://maandhan.in/' },
  { id: 'pm-poshan', displayName: 'PM POSHAN', cardCategory: 'Health', category: 'HEALTHCARE', audience: 'For children in eligible schools', description: 'Learn about the school meal program and its nutrition support.', officialUrl: 'https://pmposhan.education.gov.in/' },
  { id: 'pm-matru-vandana', displayName: 'Pradhan Mantri Matru Vandana Yojana', cardCategory: 'Women', category: 'WOMEN_EMPOWERMENT', audience: 'For eligible pregnant and lactating women', description: 'Find information about maternity benefit support and how to apply.', officialUrl: 'https://pmmvy.wcd.gov.in/' },
];

export const seedSchemes = schemeCards.map((card, index) => {
  const details = detailedSchemesByCardId[card.id] || {};
  const fallbackId = `65f0000000000000000000${(index + 11).toString(16).padStart(2, '0')}`;
  return {
    ...details,
    _id: previousIdsByCardId[card.id] || fallbackId,
    slug: card.id,
    name: details.name || card.displayName,
    displayName: card.displayName,
    cardCategory: card.cardCategory,
    audience: card.audience,
    cardDescription: card.description,
    displayOrder: index + 1,
    description: details.description || card.description,
    category: card.category,
    department: details.department || '',
    state: details.state || 'ALL',
    benefits: details.benefits || '',
    eligibilityRules: details.eligibilityRules || [],
    requiredDocuments: details.requiredDocuments || [],
    applicationProcess: details.applicationProcess || '',
    officialUrl: card.officialUrl,
    sourceType: details.sourceType || 'UNVERIFIED',
    isActive: true,
  };
});

export default seedSchemes;

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding.');

    // Upsert only the curated seed records so unrelated catalogue entries remain untouched.
    const operations = seedSchemes.map((scheme) => {
      const { _id, ...fields } = scheme;
      const slug = fields.slug || fields.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      return {
        updateOne: {
          filter: { _id },
          update: { $set: { ...fields, slug } },
          upsert: true,
        },
      };
    });
    await Scheme.bulkWrite(operations);
    console.log(`Seeded or updated ${seedSchemes.length} government schemes.`);

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
