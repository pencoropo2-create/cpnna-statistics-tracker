import Types "../types/weeks";
import Common "../types/common";
import WeeksLib "../lib/weeks";
import AccessLib "../lib/access";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";
import EmailClient "mo:caffeineai-email/emailClient";

mixin (
  weeks : WeeksLib.State,
  accessControlState : AccessControl.AccessControlState,
  approvalState : UserApproval.UserApprovalState,
) {
  /// Validación mínima de una dirección de correo institucional.
  func isValidEmail(value : Text) : Bool {
    let at = value.split(#char '@').toArray();
    if (at.size() != 2) { return false };
    let local = at[0];
    let domain = at[1];
    if (local.size() == 0 or domain.size() == 0) { return false };
    domain.contains(#char '.');
  };

  /// Crea una semana estadística nueva para el usuario que la captura.
  public shared ({ caller }) func createWeek(input : Types.WeekInput) : async Types.WeekRecord {
    AccessLib.requireApproved(accessControlState, approvalState, caller);
    switch (WeeksLib.createWeek(weeks, caller, input)) {
      case (#ok(record)) { record };
      case (#err(err)) { Common.trapValidation(err) };
    };
  };

  /// Actualiza una semana existente del usuario que la captura.
  public shared ({ caller }) func updateWeek(id : Common.WeekId, input : Types.WeekInput) : async ?Types.WeekRecord {
    AccessLib.requireApproved(accessControlState, approvalState, caller);
    switch (WeeksLib.updateWeek(weeks, caller, id, input)) {
      case (#ok(record)) { ?record };
      case (#err(#notFound(_))) { null };
      case (#err(err)) { Common.trapValidation(err) };
    };
  };

  /// Lee una semana del usuario que la captura.
  public query ({ caller }) func getWeek(id : Common.WeekId) : async ?Types.WeekRecord {
    WeeksLib.getWeek(weeks, caller, id);
  };

  /// Lista los resúmenes de las semanas del usuario que la captura.
  public query ({ caller }) func listWeeks() : async [Types.WeekSummary] {
    WeeksLib.listWeeks(weeks, caller);
  };

  /// Elimina una semana del usuario que la captura.
  public shared ({ caller }) func deleteWeek(id : Common.WeekId) : async Bool {
    AccessLib.requireApproved(accessControlState, approvalState, caller);
    WeeksLib.deleteWeek(weeks, caller, id);
  };

  /// Calcula los totales de una semana.
  public query ({ caller }) func getWeekTotals(id : Common.WeekId) : async ?Types.WeekTotals {
    switch (WeeksLib.getWeek(weeks, caller, id)) {
      case (?record) { ?WeeksLib.totals(record) };
      case null { null };
    };
  };

  /// Devuelve las alertas de auditoría de una semana.
  public query ({ caller }) func getWeekAlerts(id : Common.WeekId) : async [Types.AuditAlert] {
    switch (WeeksLib.getWeek(weeks, caller, id)) {
      case (?record) { WeeksLib.alerts(record) };
      case null { [] };
    };
  };

  /// Envía el consolidado semanal por correo institucional.
  public shared ({ caller }) func sendWeekReportEmail(id : Common.WeekId, recipient : Text) : async Types.SendReportResult {
    AccessLib.requireApproved(accessControlState, approvalState, caller);
    let record = switch (WeeksLib.getWeek(weeks, caller, id)) {
      case (?record) { record };
      case null { return #err("Semana no encontrada") };
    };
    let trimmed = recipient.trim(#char ' ');
    if (not isValidEmail(trimmed)) {
      return #err("Correo destinatario inválido");
    };
    let result = await EmailClient.sendServiceEmail(
      "no-reply",
      [trimmed],
      WeeksLib.reportSubject(record),
      WeeksLib.reportHtml(record),
    );
    switch (result) {
      case (#ok) { #ok };
      case (#err(error)) { #err(error) };
    };
  };
};
