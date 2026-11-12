import Types "../types/catalog";

module {
  /// Catálogo institucional de trámites y medidas del CPNNA.
  /// El orden de la lista define el orden de presentación en el Formato 1.
  let catalog : [Types.Tramite] = [
    // Aperturas de causas
    { id = 1; code = "AC-01"; name = "Apertura de causa por solicitud"; category = #aperturaCausa; order = 1 },
    { id = 2; code = "AC-02"; name = "Apertura de causa de oficio"; category = #aperturaCausa; order = 2 },
    { id = 3; code = "AC-03"; name = "Apertura de causa por remisión"; category = #aperturaCausa; order = 3 },
    { id = 4; code = "AC-04"; name = "Reapertura de causa"; category = #aperturaCausa; order = 4 },
    // Medidas de cuidado
    { id = 5; code = "MC-01"; name = "Medida de cuidado en familia de origen"; category = #medidaCuidado; order = 5 },
    { id = 6; code = "MC-02"; name = "Medida de cuidado en familia sustituta"; category = #medidaCuidado; order = 6 },
    { id = 7; code = "MC-03"; name = "Medida de cuidado en hogar de paso"; category = #medidaCuidado; order = 7 },
    { id = 8; code = "MC-04"; name = "Medida de cuidado en entidad de protección"; category = #medidaCuidado; order = 8 },
    { id = 9; code = "MC-05"; name = "Medida de cuidado en casa hogar"; category = #medidaCuidado; order = 9 },
    { id = 10; code = "MC-06"; name = "Medida de cuidado provisional"; category = #medidaCuidado; order = 10 },
    { id = 11; code = "MC-07"; name = "Revisión de medida de cuidado"; category = #medidaCuidado; order = 11 },
    // Medidas de responsabilidad
    { id = 12; code = "MR-01"; name = "Medida de responsabilidad con amonestación"; category = #medidaResponsabilidad; order = 12 },
    { id = 13; code = "MR-02"; name = "Medida de responsabilidad con reglas de conducta"; category = #medidaResponsabilidad; order = 13 },
    { id = 14; code = "MR-03"; name = "Medida de responsabilidad con libertad asistida"; category = #medidaResponsabilidad; order = 14 },
    { id = 15; code = "MR-04"; name = "Medida de responsabilidad con prestación de servicios"; category = #medidaResponsabilidad; order = 15 },
    { id = 16; code = "MR-05"; name = "Medida de responsabilidad con reparación del daño"; category = #medidaResponsabilidad; order = 16 },
    { id = 17; code = "MR-06"; name = "Medida de responsabilidad con semi-libertad"; category = #medidaResponsabilidad; order = 17 },
    { id = 18; code = "MR-07"; name = "Medida de responsabilidad con privación de libertad"; category = #medidaResponsabilidad; order = 18 },
    // Remisiones
    { id = 19; code = "RE-01"; name = "Remisión al Ministerio Público"; category = #remision; order = 19 },
    { id = 20; code = "RE-02"; name = "Remisión al tribunal de protección"; category = #remision; order = 20 },
    { id = 21; code = "RE-03"; name = "Remisión a defensoría de la niñez"; category = #remision; order = 21 },
    { id = 22; code = "RE-04"; name = "Remisión a salud pública"; category = #remision; order = 22 },
    { id = 23; code = "RE-05"; name = "Remisión a educación"; category = #remision; order = 23 },
    { id = 24; code = "RE-06"; name = "Remisión a otra institución"; category = #remision; order = 24 },
    // Autorizaciones de viaje nacional
    { id = 25; code = "AVN-01"; name = "Autorización de viaje nacional de niño"; category = #autorizacionViajeNacional; order = 25 },
    { id = 26; code = "AVN-02"; name = "Autorización de viaje nacional de adolescente"; category = #autorizacionViajeNacional; order = 26 },
    { id = 27; code = "AVN-03"; name = "Autorización de viaje nacional con representante"; category = #autorizacionViajeNacional; order = 27 },
    { id = 28; code = "AVN-04"; name = "Autorización de viaje nacional por delegación"; category = #autorizacionViajeNacional; order = 28 },
    // Autorizaciones de viaje internacional
    { id = 29; code = "AVI-01"; name = "Autorización de viaje internacional de niño"; category = #autorizacionViajeInternacional; order = 29 },
    { id = 30; code = "AVI-02"; name = "Autorización de viaje internacional de adolescente"; category = #autorizacionViajeInternacional; order = 30 },
    { id = 31; code = "AVI-03"; name = "Autorización de viaje internacional con representante"; category = #autorizacionViajeInternacional; order = 31 },
    { id = 32; code = "AVI-04"; name = "Autorización de viaje internacional por delegación"; category = #autorizacionViajeInternacional; order = 32 },
    // Constataciones
    { id = 33; code = "CO-01"; name = "Constatación de situación de riesgo"; category = #constatacion; order = 33 },
    { id = 34; code = "CO-02"; name = "Constatación de vulneración de derechos"; category = #constatacion; order = 34 },
    { id = 35; code = "CO-03"; name = "Constatación de trabajo infantil"; category = #constatacion; order = 35 },
    { id = 36; code = "CO-04"; name = "Constatación de maltrato"; category = #constatacion; order = 36 },
    // Psicología
    { id = 37; code = "PS-01"; name = "Evaluación psicológica"; category = #psicologia; order = 37 },
    { id = 38; code = "PS-02"; name = "Informe psicológico"; category = #psicologia; order = 38 },
    { id = 39; code = "PS-03"; name = "Terapia psicológica"; category = #psicologia; order = 39 },
    { id = 40; code = "PS-04"; name = "Acompañamiento psicológico"; category = #psicologia; order = 40 },
    // Otras actuaciones
    { id = 41; code = "OT-01"; name = "Orientación y asesoría familiar"; category = #otra; order = 41 },
    { id = 42; code = "OT-02"; name = "Visita domiciliaria"; category = #otra; order = 42 },
    { id = 43; code = "OT-03"; name = "Citación y notificación"; category = #otra; order = 43 },
    { id = 44; code = "OT-04"; name = "Otra actuación institucional"; category = #otra; order = 44 },
  ];

  /// Devuelve el catálogo completo de trámites y medidas, ordenado.
  public func listTramites() : [Types.Tramite] {
    catalog;
  };

  /// Busca un trámite por su identificador.
  public func getTramite(id : Nat) : ?Types.Tramite {
    catalog.find(func t = t.id == id);
  };

  /// Devuelve los indicadores de gestión soportados.
  public func listIndicators() : [Types.ManagementIndicator] {
    [#seguimientoCausa, #expedientesAperturados, #entrevistas];
  };
};
