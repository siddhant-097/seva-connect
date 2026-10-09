import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEligibility, evaluateMultipleSchemes } from '../src/services/eligibility/eligibilityEngine.js';

test('matches normalized profile values against scheme rules', () => {
    const result = evaluateEligibility(
        { state: ' Uttar Pradesh ', occupation: 'farmer', age: 25 },
        {
            state: 'uttar pradesh',
            eligibilityRules: [
                { field: 'state', operator: 'eq', value: 'Uttar Pradesh' },
                { field: 'occupation', operator: 'eq', value: 'FARMER' },
                { field: 'age', operator: 'gte', value: 18 },
            ],
        },
    );

    assert.equal(result.status, 'POTENTIALLY_RELEVANT');
    assert.equal(result.score, 1);
    assert.deepEqual(result.failedCriteria, []);
});

test('reports missing profile values for verification', () => {
    const result = evaluateEligibility(
        { occupation: 'student' },
        { eligibilityRules: [{ field: 'age', operator: 'gte', value: 18 }] },
    );

    assert.equal(result.status, 'NEEDS_VERIFICATION');
    assert.deepEqual(result.needsVerification, ['age']);
});

test('reports failed criteria and does not mutate scheme rules', () => {
    const scheme = {
        state: 'Maharashtra',
        eligibilityRules: [{ field: 'age', operator: 'gte', value: 18 }],
    };

    const result = evaluateEligibility({ state: 'Delhi', age: 16 }, scheme);

    assert.equal(result.status, 'NOT_CURRENTLY_MATCHED');
    assert.deepEqual(scheme.eligibilityRules, [{ field: 'age', operator: 'gte', value: 18 }]);
});

test('sorts multiple scheme results by score', () => {
    const results = evaluateMultipleSchemes(
        { age: 25 },
        [
            { id: 'partial', name: 'Partial', eligibilityRules: [{ field: 'age', operator: 'gte', value: 18 }, { field: 'income', operator: 'lte', value: 100000 }] },
            { id: 'full', name: 'Full', eligibilityRules: [{ field: 'age', operator: 'gte', value: 18 }] },
        ],
    );

    assert.deepEqual(results.map((result) => result.schemeId), ['full', 'partial']);
});