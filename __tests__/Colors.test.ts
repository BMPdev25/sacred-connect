import { APP_COLORS } from '../constants/Colors';

describe('Colors', () => {
  it('should have primary color', () => {
    expect(APP_COLORS.primary).toBe('#FF6B00');
  });

  it('should have white and black defined', () => {
    expect(APP_COLORS.white).toBe('#FFFFFF');
    expect(APP_COLORS.black).toBe('#000000');
  });
});
