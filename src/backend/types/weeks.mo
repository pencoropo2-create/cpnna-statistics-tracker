import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Common "common";
import Catalog "catalog";

module {
  /// Conteo de un trámite para un día concreto del ciclo.
  public type TramiteCount = {
    tramiteId : Common.TramiteId;
    day : Common.WeekDay;
    count : Nat;
  };

  /// Conteo de un indicador de gestión para un día concreto.
  public type IndicatorCount = {
    indicator : Catalog.ManagementIndicator;
    day : Common.WeekDay;
    count : Nat;
  };

  /// Desglose demográfico de un día: rango etario y género.
  public type DemographicCount = {
    day : Common.WeekDay;
    ageRange : Common.AgeRange;
    gender : Common.Gender;
    count : Nat;
  };

  /// Registro semanal estadístico completo del CPNNA.
  public type WeekRecord = {
    id : Common.WeekId;
    owner : Principal;
    startDate : Text;
    tramiteCounts : [TramiteCount];
    indicatorCounts : [IndicatorCount];
    demographics : [DemographicCount];
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Datos de entrada para crear o actualizar una semana.
  public type WeekInput = {
    startDate : Text;
    tramiteCounts : [TramiteCount];
    indicatorCounts : [IndicatorCount];
    demographics : [DemographicCount];
  };

  /// Totales calculados de una semana.
  public type WeekTotals = {
    totalTramites : Nat;
    totalUsuarios : Nat;
    totalDemografico : Nat;
    perDayTramites : [(Common.WeekDay, Nat)];
    perDayUsuarios : [(Common.WeekDay, Nat)];
    perTramite : [(Common.TramiteId, Nat)];
    perAgeRange : [(Common.AgeRange, Nat)];
    hasDiscrepancy : Bool;
  };

  /// Resumen de una semana para listados.
  public type WeekSummary = {
    id : Common.WeekId;
    startDate : Text;
    totalTramites : Nat;
    totalUsuarios : Nat;
    hasDiscrepancy : Bool;
    updatedAt : Common.Timestamp;
  };

  /// Alerta de auditoría por discrepancia entre Formato 1 y Formato 2.
  public type AuditAlert = {
    day : Common.WeekDay;
    format1Total : Nat;
    format2Total : Nat;
  };

  /// Resultado del envío del consolidado semanal por correo institucional.
  public type SendReportResult = {
    #ok;
    #err : Text;
  };

  /// Suma los conteos de trámites de un día concreto.
  func tramitesForDay(week : WeekRecord, day : Common.WeekDay) : Nat {
    var total = 0;
    for (entry in week.tramiteCounts.values()) {
      if (entry.day == day) { total += entry.count };
    };
    total;
  };

  /// Suma el desglose demográfico de un día concreto.
  func demographicsForDay(week : WeekRecord, day : Common.WeekDay) : Nat {
    var total = 0;
    for (entry in week.demographics.values()) {
      if (entry.day == day) { total += entry.count };
    };
    total;
  };

  /// Entrada vacía con la fecha de inicio indicada.
  public func emptyWeekInput(startDate : Text) : WeekInput {
    {
      startDate;
      tramiteCounts = [];
      indicatorCounts = [];
      demographics = [];
    };
  };

  /// Calcula los totales de una semana.
  public func computeTotals(week : WeekRecord) : WeekTotals {
    let days = Common.allDays();

    var totalTramites = 0;
    for (entry in week.tramiteCounts.values()) {
      totalTramites += entry.count;
    };

    var totalDemografico = 0;
    for (entry in week.demographics.values()) {
      totalDemografico += entry.count;
    };

    let perDayTramites = days.map(func day = (day, tramitesForDay(week, day)));
    let perDayUsuarios = days.map(func day = (day, demographicsForDay(week, day)));

    // Total por trámite, en el orden del catálogo.
    let tramiteIds = week.tramiteCounts.foldLeft(
      [] : [Common.TramiteId],
      func (acc, entry) {
        if (acc.contains(entry.tramiteId)) { acc } else { acc.concat([entry.tramiteId]) };
      },
    );
    let perTramite = tramiteIds.map(
      func id = (
        id,
        week.tramiteCounts.foldLeft(0, func (sum, entry) = if (entry.tramiteId == id) { sum + entry.count } else { sum }),
      )
    );

    // Total por rango etario, en el orden canónico.
    let ageRanges : [Common.AgeRange] = [
      #nino0a5,
      #nino6a11,
      #nino12a13,
      #adolescente14a17,
      #adulto18mas,
    ];
    let perAgeRange = ageRanges.map(
      func range = (
        range,
        week.demographics.foldLeft(0, func (sum, entry) = if (entry.ageRange == range) { sum + entry.count } else { sum }),
      )
    );

    // El total de usuarios atendidos es el reportado por el Formato 1 (trámites).
    let totalUsuarios = totalTramites;

    var hasDiscrepancy = false;
    for (day in days.values()) {
      if (tramitesForDay(week, day) != demographicsForDay(week, day)) {
        hasDiscrepancy := true;
      };
    };

    {
      totalTramites;
      totalUsuarios;
      totalDemografico;
      perDayTramites;
      perDayUsuarios;
      perTramite;
      perAgeRange;
      hasDiscrepancy;
    };
  };

  /// Devuelve las alertas de auditoría de una semana.
  public func auditAlerts(week : WeekRecord) : [AuditAlert] {
    let days = Common.allDays();
    days.foldLeft(
      [] : [AuditAlert],
      func (acc, day) {
        let format1 = tramitesForDay(week, day);
        let format2 = demographicsForDay(week, day);
        if (format1 != format2) {
          acc.concat([{ day; format1Total = format1; format2Total = format2 }]);
        } else {
          acc;
        };
      },
    );
  };
};
