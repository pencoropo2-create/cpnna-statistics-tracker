import Types "../types/access";
import AccessLib "../lib/access";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";

mixin (
  accessControlState : AccessControl.AccessControlState,
  approvalState : UserApproval.UserApprovalState,
) {
  /// Devuelve el resumen de acceso del usuario que consulta.
  public query ({ caller }) func getAccessSummary() : async Types.AccessSummary {
    AccessLib.summary(accessControlState, approvalState, caller);
  };
};
