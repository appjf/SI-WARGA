import { describe, expect, it } from 'vitest';
import { COMMUNITY_IDENTITY, DESIGN_TOKENS } from '@/styles/tokens';
import { cn } from '@/lib/utils';

describe('Phase 1/2 Foundation Scaffold', () => {
  it('defines community identity constants with Asia/Jakarta timezone', () => {
    expect(COMMUNITY_IDENTITY.code).toBe('GGR-ICMS');
    expect(COMMUNITY_IDENTITY.displayTimeZone).toBe('Asia/Jakarta');
    expect(COMMUNITY_IDENTITY.locale).toBe('id-ID');
  });

  it('defines primary design system tokens', () => {
    expect(DESIGN_TOKENS.colors.primary).toBe('#1F5E4A');
    expect(DESIGN_TOKENS.colors.secondary).toBe('#D9A441');
  });

  it('merges utility class names cleanly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
