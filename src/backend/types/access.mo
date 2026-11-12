module {
  /// Estado de una solicitud de acceso a la aplicación.
  public type AccessRequestStatus = {
    #pending;
    #approved;
    #rejected;
  };

  /// Resumen de acceso del usuario que consulta.
  public type AccessSummary = {
    isApproved : Bool;
    isAdmin : Bool;
    status : AccessRequestStatus;
  };

  /// Etiqueta legible en español para el estado de una solicitud.
  public func statusLabel(status : AccessRequestStatus) : Text {
    switch (status) {
      case (#pending) { "Pendiente" };
      case (#approved) { "Aprobado" };
      case (#rejected) { "Rechazado" };
    };
  };
};
