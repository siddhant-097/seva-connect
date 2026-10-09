/**
 * Deterministic Eligibility Engine
 *
 * Evaluates a user profile against a scheme's eligibility rules.
 * The LLM never decides eligibility — this engine does.
 *
 * Each rule has: { field, operator, value }
 * Supported operators: eq, neq, gt, gte, lt, lte, in, nin, between, exists
 */

/**
 * Derive computed profile fields (e.g. age from dateOfBirth).
 */
function deriveProfileFields(profile) {
    const derived = { ...profile };

    if (profile.dateOfBirth) {
        const dob = new Date(profile.dateOfBirth);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        derived.age = age;
    }

    // normalize occupation to uppercase for matching
    if (derived.occupation) {
        derived.occupation = derived.occupation.toUpperCase();
    }
    if (derived.gender) {
        derived.gender = derived.gender.toUpperCase();
    }
    if (derived.category) {
        derived.category = derived.category.toUpperCase();
    }
    if (derived.residenceType) {
        derived.residenceType = derived.residenceType.toUpperCase();
    }
    if (derived.state) {
        derived.state = derived.state.toLowerCase().trim();
    }

    return derived;
}

/**
 * Evaluate a single rule against the profile.
 */
function evaluateRule(rule, profile) {
    let fieldValue = profile[rule.field];

    // If the field doesn't exist in profile, it's unverifiable
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return 'unverifiable';
    }

    // Normalize string comparisons
    const ruleValue = rule.value;
    if (typeof fieldValue === 'string') fieldValue = fieldValue.toLowerCase().trim();

    switch (rule.operator) {
        case 'eq': {
            const target = typeof ruleValue === 'string' ? ruleValue.toLowerCase().trim() : ruleValue;
            return fieldValue === target ? 'match' : 'fail';
        }
        case 'neq': {
            const target = typeof ruleValue === 'string' ? ruleValue.toLowerCase().trim() : ruleValue;
            return fieldValue !== target ? 'match' : 'fail';
        }
        case 'gt':
            return Number(fieldValue) > Number(ruleValue) ? 'match' : 'fail';
        case 'gte':
            return Number(fieldValue) >= Number(ruleValue) ? 'match' : 'fail';
        case 'lt':
            return Number(fieldValue) < Number(ruleValue) ? 'match' : 'fail';
        case 'lte':
            return Number(fieldValue) <= Number(ruleValue) ? 'match' : 'fail';
        case 'in': {
            const list = Array.isArray(ruleValue) ? ruleValue.map((v) => (typeof v === 'string' ? v.toLowerCase().trim() : v)) : [];
            return list.includes(fieldValue) ? 'match' : 'fail';
        }
        case 'nin': {
            const list = Array.isArray(ruleValue) ? ruleValue.map((v) => (typeof v === 'string' ? v.toLowerCase().trim() : v)) : [];
            return !list.includes(fieldValue) ? 'match' : 'fail';
        }
        case 'between': {
            const num = Number(fieldValue);
            const [min, max] = Array.isArray(ruleValue) ? ruleValue : [0, 0];
            return num >= Number(min) && num <= Number(max) ? 'match' : 'fail';
        }
        case 'exists':
            return fieldValue ? 'match' : 'fail';
        default:
            return 'unverifiable';
    }
}

/**
 * Evaluate all eligibility rules for a scheme against a user profile.
 *
 * Returns:
 * {
 *   status: 'POTENTIALLY_RELEVANT' | 'NEEDS_VERIFICATION' | 'NOT_CURRENTLY_MATCHED',
 *   score: 0..1,
 *   matchedCriteria: string[],
 *   failedCriteria: string[],
 *   needsVerification: string[]
 * }
 */
export function evaluateEligibility(userProfile, scheme) {
    const profile = deriveProfileFields(userProfile);
    const rules = [...(scheme.eligibilityRules || [])];

    if (rules.length === 0) {
        return {
            status: 'POTENTIALLY_RELEVANT',
            score: 0.5,
            matchedCriteria: [],
            failedCriteria: [],
            needsVerification: ['all_criteria'],
        };
    }

    // Also check state matching if scheme.state !== 'ALL'
    if (scheme.state && scheme.state !== 'ALL') {
        const stateRule = { field: 'state', operator: 'eq', value: scheme.state };
        const existing = rules.find((r) => r.field === 'state');
        if (!existing) {
            rules.push(stateRule);
        }
    }

    const matched = [];
    const failed = [];
    const needs = [];

    for (const rule of rules) {
        const result = evaluateRule(rule, profile);
        if (result === 'match') {
            matched.push(rule.field);
        } else if (result === 'fail') {
            failed.push(rule.field);
        } else {
            needs.push(rule.field);
        }
    }

    const total = rules.length;
    const score = total > 0 ? matched.length / total : 0;

    let status;
    if (failed.length > 0) {
        status = 'NOT_CURRENTLY_MATCHED';
    } else if (needs.length > 0) {
        status = 'NEEDS_VERIFICATION';
    } else {
        status = 'POTENTIALLY_RELEVANT';
    }

    return {
        status,
        score: Math.round(score * 100) / 100,
        matchedCriteria: [...new Set(matched)],
        failedCriteria: [...new Set(failed)],
        needsVerification: [...new Set(needs)],
    };
}

/**
 * Run eligibility for a user against multiple schemes.
 * Returns an array of results sorted by score descending.
 */
export function evaluateMultipleSchemes(userProfile, schemes) {
    return schemes
        .map((scheme) => ({
            schemeId: scheme._id || scheme.id,
            schemeName: scheme.name,
            ...evaluateEligibility(userProfile, scheme),
        }))
        .sort((a, b) => b.score - a.score);
}
