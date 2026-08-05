/*
 * Test stub for the host platform's client accessor.
 *
 * The real MatrixClientPeg is owned by the host platform and is protected
 * (PRD §6.1). Tests substitute it so the Sovereign service layer can be
 * exercised against a controlled client without the platform booting.
 */
export const MatrixClientPeg = { get: (): unknown => null };
