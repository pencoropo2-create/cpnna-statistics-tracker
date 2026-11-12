import Common "common";

module {
  /// Categoría institucional de un trámite o medida.
  public type TramiteCategory = {
    #aperturaCausa;
    #medidaCuidado;
    #medidaResponsabilidad;
    #remision;
    #autorizacionViajeNacional;
    #autorizacionViajeInternacional;
    #constatacion;
    #psicologia;
    #otra;
  };

  /// Entrada del catálogo de trámites y medidas.
  public type Tramite = {
    id : Common.TramiteId;
    code : Text;
    name : Text;
    category : TramiteCategory;
    order : Nat;
  };

  /// Indicador de gestión reportado al pie del Formato 1.
  public type ManagementIndicator = {
    #seguimientoCausa;
    #expedientesAperturados;
    #entrevistas;
  };

  /// Etiqueta legible en español de una categoría.
  public func categoryLabel(category : TramiteCategory) : Text {
    switch (category) {
      case (#aperturaCausa) { "Aperturas de causas" };
      case (#medidaCuidado) { "Medidas de cuidado" };
      case (#medidaResponsabilidad) { "Medidas de responsabilidad" };
      case (#remision) { "Remisiones" };
      case (#autorizacionViajeNacional) { "Autorizaciones de viaje nacional" };
      case (#autorizacionViajeInternacional) { "Autorizaciones de viaje internacional" };
      case (#constatacion) { "Constataciones" };
      case (#psicologia) { "Psicología" };
      case (#otra) { "Otras actuaciones" };
    };
  };

  /// Catálogo canónico de trámites y medidas del CPNNA.
  public let tramites : [Tramite] = [
    { id = 1; code = "AC"; name = "Aperturas de causas"; category = #aperturaCausa; order = 1 },
    { id = 2; code = "MC"; name = "Medidas de cuidado"; category = #medidaCuidado; order = 2 },
    { id = 3; code = "MR"; name = "Medidas de responsabilidad"; category = #medidaResponsabilidad; order = 3 },
    { id = 4; code = "RE"; name = "Remisiones"; category = #remision; order = 4 },
    { id = 5; code = "AVN"; name = "Autorizaciones de viaje nacional"; category = #autorizacionViajeNacional; order = 5 },
    { id = 6; code = "AVI"; name = "Autorizaciones de viaje internacional"; category = #autorizacionViajeInternacional; order = 6 },
    { id = 7; code = "CO"; name = "Constataciones"; category = #constatacion; order = 7 },
    { id = 8; code = "PS"; name = "Psicología"; category = #psicologia; order = 8 },
    { id = 9; code = "OT"; name = "Otras actuaciones"; category = #otra; order = 9 },
  ];

  /// Busca un trámite del catálogo por su identificador.
  public func getTramite(id : Common.TramiteId) : ?Tramite {
    for (tramite in tramites.values()) {
      if (tramite.id == id) { return ?tramite };
    };
    null;
  };

  /// Etiqueta legible en español de un indicador de gestión.
  public func indicatorLabel(indicator : ManagementIndicator) : Text {
    switch (indicator) {
      case (#seguimientoCausa) { "Seguimiento de causa" };
      case (#expedientesAperturados) { "Expedientes aperturados" };
      case (#entrevistas) { "Entrevistas" };
    };
  };
};
