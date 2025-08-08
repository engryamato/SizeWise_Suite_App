/**
 * TierEnforcer import/file access tests (integration style)
 *
 * Validates new additive methods validateImportAccess and validateFileAccess
 * using lightweight FeatureManager + userRepository stubs.
 */

import TierEnforcer from '@backend/services/enforcement/TierEnforcer';
import { FeatureManager } from '@backend/features/FeatureManager';

// Minimal DatabaseManager stub
const dbStub: any = {};

function makeFeatureManagerWithTier(tier: 'free'|'pro'|'enterprise') {
  const fm = new FeatureManager(dbStub) as any;
  fm.userRepository = {
    getUser: jest.fn(async (_userId: string) => ({ id: _userId, tier }))
  };
  return fm as FeatureManager;
}

describe('TierEnforcer - validateImportAccess', () => {
  test('allows import within size limit for free tier; denies when exceeding 10MB with requiredTier pro', async () => {
    const featureManager = makeFeatureManagerWithTier('free');
    const te = new TierEnforcer(featureManager, dbStub);

    // Under 10MB
    const small = await te.validateImportAccess('u1', '.json', 5 * 1024 * 1024);
    expect(small.allowed).toBe(true);
    expect(small.currentTier).toBe('free');

    // Over 10MB -> require pro
    const big = await te.validateImportAccess('u1', '.json', 20 * 1024 * 1024);
    expect(big.allowed).toBe(false);
    expect(big.requiredTier).toBe('pro');
  });

  test('requires enterprise for imports exceeding 100MB for pro user', async () => {
    const featureManager = makeFeatureManagerWithTier('pro');
    const te = new TierEnforcer(featureManager, dbStub);

    const huge = await te.validateImportAccess('u2', '.json', 200 * 1024 * 1024);
    expect(huge.allowed).toBe(false);
    expect(huge.requiredTier).toBe('enterprise');
  });

  test('allows large imports for enterprise up to 1GB threshold', async () => {
    const featureManager = makeFeatureManagerWithTier('enterprise');
    const te = new TierEnforcer(featureManager, dbStub);

    const ok = await te.validateImportAccess('u3', '.json', 900 * 1024 * 1024);
    expect(ok.allowed).toBe(true);
    expect(ok.currentTier).toBe('enterprise');
  });
});

describe('TierEnforcer - validateFileAccess', () => {
  test('returns allowed true for both read and write (current implementation)', async () => {
    const featureManager = makeFeatureManagerWithTier('pro');
    const te = new TierEnforcer(featureManager, dbStub);

    const readRes = await te.validateFileAccess('any', 'read');
    const writeRes = await te.validateFileAccess('any', 'write');

    expect(readRes.allowed).toBe(true);
    expect(writeRes.allowed).toBe(true);
    expect(readRes.currentTier).toBe('pro');
  });
});

