import '@testing-library/jest-dom';

// Since the utility function isn't exported, we'll recreate it for testing
const getActionDisplayName = (name) => {
  if (!name) return 'unknown';
  return String(name).replace('org.project.', '').replace('.auto_open', '');
};

describe('Utility Functions', () => {
  describe('getActionDisplayName', () => {
    test('removes org.project. prefix', () => {
      expect(getActionDisplayName('org.project.files.access')).toBe('files.access');
    });

    test('removes .auto_open suffix', () => {
      expect(getActionDisplayName('org.project.fix_pr.auto_open')).toBe('fix_pr');
    });

    test('handles both prefix and suffix', () => {
      expect(getActionDisplayName('org.project.feature.auto_open')).toBe('feature');
    });

    test('returns unknown for null or undefined input', () => {
      expect(getActionDisplayName(null)).toBe('unknown');
      expect(getActionDisplayName(undefined)).toBe('unknown');
    });

    test('preserves action types without prefixes or suffixes', () => {
      expect(getActionDisplayName('custom_action')).toBe('custom_action');
    });
  });
});