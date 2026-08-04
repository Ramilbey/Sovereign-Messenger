/*
 * Sovereign Messenger — Sprint 2 Architectural Alignment
 * Note: Duplicate UI login flows are avoided per Sprint 2 PRD requirements.
 * Authentication for Production Mode (SOVEREIGN_MODE=false) uses Element Web's
 * own native login/session/sync (Lifecycle.ts, MatrixClientPeg) unmodified.
 * Element's authenticated client is registered with the Sovereign service
 * layer by MatrixClientBridge (sovereign/bridge/MatrixClientBridge.ts), and
 * the current user's role comes from MatrixUserService — there is no separate
 * Sovereign-owned auth/session/sync path.
 */
export {};
