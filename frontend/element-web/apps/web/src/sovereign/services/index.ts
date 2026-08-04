/*
 * Sovereign Messenger — Services Exports
 */

export * from "./MessageService";
export * from "./DemoMessageService";
export * from "./MatrixMessageService";
export * from "./MatrixClientService";
export * from "./MatrixUserService";
export * from "./SessionService";
export * from "./SessionBootstrapService";
export * from "./BootstrapCoordinator";
export * from "./MatrixRoomService";
// MatrixTimelineService also exports a SovereignMessage type with a different
// shape to MessageService's; export the service explicitly to avoid an
// ambiguous re-export (TS2308).
export { MatrixTimelineService } from "./MatrixTimelineService";
export * from "../bridge/MatrixClientBridge";

