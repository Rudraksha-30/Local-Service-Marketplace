/**
 * Time-slot helpers (FR-15: prevent double booking).
 *
 * Two time ranges [aStart, aEnd) and [bStart, bEnd) overlap exactly when
 * each one starts before the other one ends. Back-to-back bookings
 * (one ends at 10:00, the next starts at 10:00) do NOT overlap.
 */

function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000);
}

module.exports = { overlaps, addMinutes };
