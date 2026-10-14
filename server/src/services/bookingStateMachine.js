/**
 * Booking State Machine  (FR-14, FR-16, NFR-13)
 *
 * A booking moves through a fixed set of states. Instead of scattering
 * "if (status === ...)" checks across controllers, ALL the rules live in this
 * one table. To add a new state later (e.g. "rescheduled"), you only edit
 * TRANSITIONS below -- nothing else changes. That is NFR-13 in practice.
 *
 *   requested --accept--> accepted --start--> in_progress --complete--> completed
 *       |  \                  |
 *       |   \--reject--> rejected
 *       \--cancel--> cancelled <--cancel-- (accepted)
 *
 * This module is pure (no database, no Express), so it is trivial to unit test.
 */

const STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

const ROLE = Object.freeze({
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
});

// from -> to -> list of roles allowed to make that move
const TRANSITIONS = {
  [STATUS.REQUESTED]: {
    [STATUS.ACCEPTED]: [ROLE.PROVIDER],
    [STATUS.REJECTED]: [ROLE.PROVIDER],
    [STATUS.CANCELLED]: [ROLE.CUSTOMER],
  },
  [STATUS.ACCEPTED]: {
    [STATUS.IN_PROGRESS]: [ROLE.PROVIDER],
    [STATUS.CANCELLED]: [ROLE.CUSTOMER, ROLE.PROVIDER],
  },
  [STATUS.IN_PROGRESS]: {
    [STATUS.COMPLETED]: [ROLE.PROVIDER],
  },
  // Terminal states: no outgoing transitions
  [STATUS.COMPLETED]: {},
  [STATUS.REJECTED]: {},
  [STATUS.CANCELLED]: {},
};

/** Is `to` a legal next state from `from`, regardless of who asks? */
function isValidTransition(from, to) {
  return Boolean(TRANSITIONS[from] && TRANSITIONS[from][to]);
}

/** Is this specific role allowed to make this move? */
function canTransition(from, to, role) {
  if (!isValidTransition(from, to)) return false;
  return TRANSITIONS[from][to].includes(role);
}

function isTerminal(status) {
  return Boolean(TRANSITIONS[status]) && Object.keys(TRANSITIONS[status]).length === 0;
}

/** States in which a booking blocks the provider's calendar (FR-15). */
const SLOT_BLOCKING_STATUSES = [STATUS.ACCEPTED, STATUS.IN_PROGRESS];

module.exports = {
  STATUS,
  ROLE,
  TRANSITIONS,
  isValidTransition,
  canTransition,
  isTerminal,
  SLOT_BLOCKING_STATUSES,
};
