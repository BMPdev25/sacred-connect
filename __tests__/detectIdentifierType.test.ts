import { detectIdentifierType } from '../utils/identifierDetection';

describe('detectIdentifierType', () => {
  describe('Email Detection', () => {
    it('should detect valid email addresses', () => {
      expect(detectIdentifierType('test@example.com')).toBe('email');
      expect(detectIdentifierType('user.name@domain.co.in')).toBe('email');
      expect(detectIdentifierType('admin@test.org')).toBe('email');
    });

    it('should handle emails with special characters', () => {
      expect(detectIdentifierType('user+tag@example.com')).toBe('email');
      expect(detectIdentifierType('first.last@company.com')).toBe('email');
    });
  });

  describe('Phone Number Detection', () => {
    it('should detect plain phone numbers', () => {
      expect(detectIdentifierType('9876543210')).toBe('phone');
      expect(detectIdentifierType('1234567890')).toBe('phone');
    });

    it('should detect phone numbers with country codes', () => {
      expect(detectIdentifierType('+919876543210')).toBe('phone');
      expect(detectIdentifierType('+1-555-123-4567')).toBe('phone');
    });

    it('should detect phone numbers with formatting', () => {
      expect(detectIdentifierType('(555) 123-4567')).toBe('phone');
      expect(detectIdentifierType('555-123-4567')).toBe('phone');
      expect(detectIdentifierType('555 123 4567')).toBe('phone');
    });

    it('should handle phone numbers with spaces and dashes', () => {
      expect(detectIdentifierType('+91 98765 43210')).toBe('phone');
      expect(detectIdentifierType('98765-43210')).toBe('phone');
    });
  });

  describe('Edge Cases', () => {
    it('should default to email for mixed alphanumeric', () => {
      expect(detectIdentifierType('user123')).toBe('email');
      expect(detectIdentifierType('test@123')).toBe('email');
    });

    it('should handle empty strings', () => {
      expect(detectIdentifierType('')).toBe('email');
    });

    it('should handle strings with only special characters', () => {
      expect(detectIdentifierType('---')).toBe('email');
      expect(detectIdentifierType('+++')).toBe('email');
    });
  });

  describe('Real-world Examples', () => {
    it('should correctly identify Indian phone numbers', () => {
      expect(detectIdentifierType('9876543210')).toBe('phone');
      expect(detectIdentifierType('+91 98765 43210')).toBe('phone');
      expect(detectIdentifierType('+91-9876543210')).toBe('phone');
    });

    it('should correctly identify common email formats', () => {
      expect(detectIdentifierType('priest@temple.com')).toBe('email');
      expect(detectIdentifierType('devotee123@gmail.com')).toBe('email');
    });
  });
});
