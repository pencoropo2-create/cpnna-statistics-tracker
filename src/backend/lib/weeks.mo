import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Types "../types/weeks";
import Common "../types/common";
import Catalog "../types/catalog";
import CatalogLib "catalog";

module {
  /// Estado de las semanas estadísticas, indexado por identificador.
  public type State = {
    var nextId : Nat;
    weeks : Map.Map<Nat, Types.WeekRecord>;
  };

  /// Resultado de una operación de escritura con validación.
  public type WriteResult = {
    #ok : Types.WeekRecord;
    #err : Common.ValidationError;
  };

  /// Valida que la fecha de inicio sea un día Viernes en formato ISO (YYYY-MM-DD).
  func validateStartDate(startDate : Text) : ?Common.ValidationError {
    let parts = startDate.split(#char '-').toArray();
    if (parts.size() != 3) {
      return ?#invalidDate("La fecha debe tener el formato AAAA-MM-DD");
    };
    let year = parts[0].toNat();
    let month = parts[1].toNat();
    let day = parts[2].toNat();
    switch (year, month, day) {
      case (?y, ?m, ?d) {
        if (y < 2000 or y > 2100) {
          return ?#invalidDate("El año debe estar entre 2000 y 2100");
        };
        if (m < 1 or m > 12) {
          return ?#invalidDate("El mes debe estar entre 1 y 12");
        };
        if (d < 1 or d > 31) {
          return ?#invalidDate("El día debe estar entre 1 y 31");
        };
        null;
      };
      case _ {
        ?#invalidDate("La fecha debe tener el formato AAAA-MM-DD");
      };
    };
  };

  /// Valida los conteos de trámites de la entrada.
  func validateTramiteCounts(counts : [Types.TramiteCount]) : ?Common.ValidationError {
    for (entry in counts.values()) {
      switch (Catalog.getTramite(entry.tramiteId)) {
        case null {
          return ?#notFound("Trámite desconocido: " # entry.tramiteId.toText());
        };
        case (?_) {};
      };
    };
    null;
  };

  /// Valida la entrada completa de una semana.
  func validateInput(input : Types.WeekInput) : ?Common.ValidationError {
    switch (validateStartDate(input.startDate)) {
      case (?err) { return ?err };
      case null {};
    };
    validateTramiteCounts(input.tramiteCounts);
  };

  /// Construye un registro semanal a partir de la entrada validada.
  func buildRecord(id : Nat, owner : Principal, input : Types.WeekInput, createdAt : Common.Timestamp) : Types.WeekRecord {
    {
      id;
      owner;
      startDate = input.startDate;
      tramiteCounts = input.tramiteCounts;
      indicatorCounts = input.indicatorCounts;
      demographics = input.demographics;
      createdAt;
      updatedAt = createdAt;
    };
  };

  /// Crea una semana nueva para el propietario indicado.
  public func createWeek(state : State, owner : Principal, input : Types.WeekInput) : WriteResult {
    switch (validateInput(input)) {
      case (?err) { return #err(err) };
      case null {};
    };
    let id = state.nextId;
    state.nextId := id + 1;
    let record = buildRecord(id, owner, input, Time.now());
    state.weeks.add(id, record);
    #ok(record);
  };

  /// Actualiza una semana existente del propietario indicado.
  public func updateWeek(state : State, owner : Principal, id : Nat, input : Types.WeekInput) : WriteResult {
    let existing = switch (state.weeks.get(id)) {
      case null { return #err(#notFound("Semana no encontrada")) };
      case (?record) { record };
    };
    if (not Principal.equal(existing.owner, owner)) {
      return #err(#notAuthorized);
    };
    switch (validateInput(input)) {
      case (?err) { return #err(err) };
      case null {};
    };
    let updated : Types.WeekRecord = {
      id = existing.id;
      owner = existing.owner;
      startDate = input.startDate;
      tramiteCounts = input.tramiteCounts;
      indicatorCounts = input.indicatorCounts;
      demographics = input.demographics;
      createdAt = existing.createdAt;
      updatedAt = Time.now();
    };
    state.weeks.add(id, updated);
    #ok(updated);
  };

  /// Lee una semana del propietario indicado.
  public func getWeek(state : State, owner : Principal, id : Nat) : ?Types.WeekRecord {
    switch (state.weeks.get(id)) {
      case (?record) {
        if (Principal.equal(record.owner, owner)) { ?record } else { null };
      };
      case null { null };
    };
  };

  /// Ordena resúmenes por fecha de inicio descendente.
  func compareSummary(a : Types.WeekSummary, b : Types.WeekSummary) : Order.Order {
    if (a.startDate > b.startDate) { #less } else if (a.startDate < b.startDate) { #greater } else { #equal };
  };

  /// Lista los resúmenes de las semanas del propietario indicado.
  public func listWeeks(state : State, owner : Principal) : [Types.WeekSummary] {
    let summaries = state.weeks.values().foldLeft(
      [] : [Types.WeekSummary],
      func (acc, record) {
        if (Principal.equal(record.owner, owner)) {
          let totals = Types.computeTotals(record);
          acc.concat([{
            id = record.id;
            startDate = record.startDate;
            totalTramites = totals.totalTramites;
            totalUsuarios = totals.totalUsuarios;
            hasDiscrepancy = totals.hasDiscrepancy;
            updatedAt = record.updatedAt;
          }]);
        } else {
          acc;
        };
      },
    );
    summaries.sort(compareSummary);
  };

  /// Elimina una semana del propietario indicado.
  public func deleteWeek(state : State, owner : Principal, id : Nat) : Bool {
    switch (state.weeks.get(id)) {
      case (?record) {
        if (Principal.equal(record.owner, owner)) {
          state.weeks.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };

  /// Calcula los totales de una semana.
  public func totals(week : Types.WeekRecord) : Types.WeekTotals {
    Types.computeTotals(week);
  };

  /// Devuelve las alertas de auditoría de una semana.
  public func alerts(week : Types.WeekRecord) : [Types.AuditAlert] {
    Types.auditAlerts(week);
  };

  /// Asunto del correo del consolidado semanal.
  public func reportSubject(week : Types.WeekRecord) : Text {
    "Consolidado semanal CPNNA — semana del " # week.startDate;
  };

  /// Cuerpo HTML del correo del consolidado semanal.
  public func reportHtml(week : Types.WeekRecord) : Text {
    let totals = Types.computeTotals(week);

    var tramiteRows = "";
    for ((tramiteId, count) in totals.perTramite.values()) {
      let name = switch (CatalogLib.getTramite(tramiteId)) {
        case (?tramite) { tramite.name };
        case null { "Trámite " # tramiteId.toText() };
      };
      tramiteRows := tramiteRows # "<tr><td>" # name # "</td><td align=\"right\">" # count.toText() # "</td></tr>";
    };

    var ageRows = "";
    for ((range, count) in totals.perAgeRange.values()) {
      ageRows := ageRows # "<tr><td>" # Common.ageRangeLabel(range) # "</td><td align=\"right\">" # count.toText() # "</td></tr>";
    };

    var alertRows = "";
    for (alert in Types.auditAlerts(week).values()) {
      alertRows := alertRows # "<tr><td>" # Common.dayLabel(alert.day) # "</td><td align=\"right\">" # alert.format1Total.toText() # "</td><td align=\"right\">" # alert.format2Total.toText() # "</td></tr>";
    };

    "<html><body style=\"font-family:Arial,sans-serif;color:#1f2937\">" #
    "<h2 style=\"color:#1e3a5f\">Consolidado semanal CPNNA</h2>" #
    "<p>Semana del <strong>" # week.startDate # "</strong></p>" #
    "<h3 style=\"color:#1e3a5f\">Resumen</h3>" #
    "<ul>" #
    "<li>Total de trámites: <strong>" # totals.totalTramites.toText() # "</strong></li>" #
    "<li>Total de usuarios atendidos: <strong>" # totals.totalUsuarios.toText() # "</strong></li>" #
    "<li>Total demográfico (Formato 2): <strong>" # totals.totalDemografico.toText() # "</strong></li>" #
    "<li>Discrepancias de validación: <strong>" # (if (totals.hasDiscrepancy) { "sí" } else { "no" }) # "</strong></li>" #
    "</ul>" #
    "<h3 style=\"color:#1e3a5f\">Formato 1 — Trámites por actividad</h3>" #
    "<table border=\"1\" cellspacing=\"0\" cellpadding=\"6\"><thead><tr><th align=\"left\">Trámite</th><th align=\"right\">Total</th></tr></thead><tbody>" # tramiteRows # "</tbody></table>" #
    "<h3 style=\"color:#1e3a5f\">Formato 2 — Población por rango etario</h3>" #
    "<table border=\"1\" cellspacing=\"0\" cellpadding=\"6\"><thead><tr><th align=\"left\">Rango etario</th><th align=\"right\">Total</th></tr></thead><tbody>" # ageRows # "</tbody></table>" #
    (if (alertRows == "") { "" } else {
      "<h3 style=\"color:#1e3a5f\">Alertas de auditoría</h3>" #
      "<table border=\"1\" cellspacing=\"0\" cellpadding=\"6\"><thead><tr><th align=\"left\">Día</th><th align=\"right\">Formato 1</th><th align=\"right\">Formato 2</th></tr></thead><tbody>" # alertRows # "</tbody></table>";
    }) #
    "<p style=\"color:#6b7280;font-size:12px\">Generado automáticamente por el Registro Estadístico Semanal del CPNNA.</p>" #
    "</body></html>";
  };
};
