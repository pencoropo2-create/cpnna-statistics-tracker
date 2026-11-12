import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";
import Types "../types/access";

module {
  /// Resumen de acceso del usuario que consulta.
  public func summary(
    accessControlState : AccessControl.AccessControlState,
    approvalState : UserApproval.UserApprovalState,
    caller : Principal,
  ) : Types.AccessSummary {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isApproved = UserApproval.isApproved(approvalState, caller);
    let status : Types.AccessRequestStatus = if (isApproved) {
      #approved;
    } else if (UserApproval.isRejected(approvalState, caller)) {
      #rejected;
    } else {
      #pending;
    };
    { isApproved; isAdmin; status };
  };

  /// Verifica que el usuario esté aprobado o sea administrador.
  public func requireApproved(
    accessControlState : AccessControl.AccessControlState,
    approvalState : UserApproval.UserApprovalState,
    caller : Principal,
  ) : () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("No autorizado: solo los usuarios aprobados pueden realizar esta acción");
    };
  };
};
