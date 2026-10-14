const { overlaps, addMinutes } = require('../src/utils/timeSlots');

const t = (hhmm) => new Date(`2026-11-01T${hhmm}:00Z`);

describe('overlaps (FR-15 double-booking detection)', () => {
  test('identical slots overlap', () => expect(overlaps(t('10:00'), t('11:00'), t('10:00'), t('11:00'))).toBe(true));
  test('partial overlap at the start', () => expect(overlaps(t('10:00'), t('11:00'), t('09:30'), t('10:30'))).toBe(true));
  test('partial overlap at the end', () => expect(overlaps(t('10:00'), t('11:00'), t('10:30'), t('11:30'))).toBe(true));
  test('one slot fully inside another', () => expect(overlaps(t('09:00'), t('12:00'), t('10:00'), t('11:00'))).toBe(true));
  test('completely separate slots do not overlap', () => expect(overlaps(t('09:00'), t('10:00'), t('11:00'), t('12:00'))).toBe(false));
  test('back-to-back slots do NOT overlap (boundary case)', () => {
    expect(overlaps(t('10:00'), t('11:00'), t('11:00'), t('12:00'))).toBe(false);
    expect(overlaps(t('11:00'), t('12:00'), t('10:00'), t('11:00'))).toBe(false);
  });
  test('is symmetric', () => {
    expect(overlaps(t('10:00'), t('11:00'), t('10:30'), t('12:00'))).toBe(
      overlaps(t('10:30'), t('12:00'), t('10:00'), t('11:00'))
    );
  });
});

describe('addMinutes', () => {
  test('adds minutes to a date', () => {
    expect(addMinutes(t('10:00'), 90).toISOString()).toBe('2026-11-01T11:30:00.000Z');
  });
});
