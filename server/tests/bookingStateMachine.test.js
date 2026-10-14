const {
  STATUS,
  ROLE,
  isValidTransition,
  canTransition,
  isTerminal,
  TRANSITIONS,
} = require('../src/services/bookingStateMachine');

describe('booking state machine', () => {
  test('happy path: requested -> accepted -> in_progress -> completed', () => {
    expect(canTransition(STATUS.REQUESTED, STATUS.ACCEPTED, ROLE.PROVIDER)).toBe(true);
    expect(canTransition(STATUS.ACCEPTED, STATUS.IN_PROGRESS, ROLE.PROVIDER)).toBe(true);
    expect(canTransition(STATUS.IN_PROGRESS, STATUS.COMPLETED, ROLE.PROVIDER)).toBe(true);
  });

  test('provider can reject a request', () => {
    expect(canTransition(STATUS.REQUESTED, STATUS.REJECTED, ROLE.PROVIDER)).toBe(true);
  });

  test('a customer cannot accept their own booking', () => {
    expect(canTransition(STATUS.REQUESTED, STATUS.ACCEPTED, ROLE.CUSTOMER)).toBe(false);
  });

  test('a customer cannot mark a job completed', () => {
    expect(canTransition(STATUS.IN_PROGRESS, STATUS.COMPLETED, ROLE.CUSTOMER)).toBe(false);
  });

  test('both parties can cancel an accepted booking (FR-16)', () => {
    expect(canTransition(STATUS.ACCEPTED, STATUS.CANCELLED, ROLE.CUSTOMER)).toBe(true);
    expect(canTransition(STATUS.ACCEPTED, STATUS.CANCELLED, ROLE.PROVIDER)).toBe(true);
  });

  test('only the customer can cancel a still-pending request', () => {
    expect(canTransition(STATUS.REQUESTED, STATUS.CANCELLED, ROLE.CUSTOMER)).toBe(true);
    expect(canTransition(STATUS.REQUESTED, STATUS.CANCELLED, ROLE.PROVIDER)).toBe(false);
  });

  test('no cancelling once the job is in progress (FR-16)', () => {
    expect(isValidTransition(STATUS.IN_PROGRESS, STATUS.CANCELLED)).toBe(false);
  });

  test('states cannot be skipped', () => {
    expect(isValidTransition(STATUS.REQUESTED, STATUS.IN_PROGRESS)).toBe(false);
    expect(isValidTransition(STATUS.REQUESTED, STATUS.COMPLETED)).toBe(false);
    expect(isValidTransition(STATUS.ACCEPTED, STATUS.COMPLETED)).toBe(false);
  });

  test('cannot move backwards', () => {
    expect(isValidTransition(STATUS.ACCEPTED, STATUS.REQUESTED)).toBe(false);
    expect(isValidTransition(STATUS.COMPLETED, STATUS.IN_PROGRESS)).toBe(false);
  });

  test.each([STATUS.COMPLETED, STATUS.REJECTED, STATUS.CANCELLED])('%s is a terminal state', (s) => {
    expect(isTerminal(s)).toBe(true);
  });

  test('non-terminal states are not terminal', () => {
    expect(isTerminal(STATUS.REQUESTED)).toBe(false);
    expect(isTerminal(STATUS.ACCEPTED)).toBe(false);
  });

  test('every state referenced as a target is itself defined in the table', () => {
    for (const targets of Object.values(TRANSITIONS)) {
      for (const to of Object.keys(targets)) expect(TRANSITIONS[to]).toBeDefined();
    }
  });

  test('unknown states are rejected safely', () => {
    expect(isValidTransition('nonsense', STATUS.ACCEPTED)).toBe(false);
    expect(isTerminal('nonsense')).toBe(false);
  });
});
