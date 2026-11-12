import Runtime "mo:core/Runtime";

module {
  /// Identificador de un registro semanal estadístico.
  public type WeekId = Nat;

  /// Identificador de un trámite o medida del catálogo institucional.
  public type TramiteId = Nat;

  /// Marca temporal en nanosegundos (Time.now()).
  public type Timestamp = Int;

  /// Día del ciclo semanal del CPNNA: Viernes a Jueves.
  public type WeekDay = {
    #viernes;
    #sabado;
    #domingo;
    #lunes;
    #martes;
    #miercoles;
    #jueves;
  };

  /// Género reportado en el desglose demográfico.
  public type Gender = {
    #femenino;
    #masculino;
  };

  /// Rango etario del desglose demográfico.
  public type AgeRange = {
    #nino0a5;
    #nino6a11;
    #nino12a13;
    #adolescente14a17;
    #adulto18mas;
  };

  /// Error genérico de validación de entrada.
  public type ValidationError = {
    #invalidDate : Text;
    #negativeValue : Text;
    #notFound : Text;
    #notAuthorized;
  };

  /// Orden canónico del ciclo Viernes a Jueves.
  public func allDays() : [WeekDay] {
    [#viernes, #sabado, #domingo, #lunes, #martes, #miercoles, #jueves];
  };

  /// Índice posicional del día dentro del ciclo (Viernes = 0).
  public func dayIndex(day : WeekDay) : Nat {
    switch (day) {
      case (#viernes) { 0 };
      case (#sabado) { 1 };
      case (#domingo) { 2 };
      case (#lunes) { 3 };
      case (#martes) { 4 };
      case (#miercoles) { 5 };
      case (#jueves) { 6 };
    };
  };

  /// Etiqueta legible en español de un día del ciclo.
  public func dayLabel(day : WeekDay) : Text {
    switch (day) {
      case (#viernes) { "Viernes" };
      case (#sabado) { "Sábado" };
      case (#domingo) { "Domingo" };
      case (#lunes) { "Lunes" };
      case (#martes) { "Martes" };
      case (#miercoles) { "Miércoles" };
      case (#jueves) { "Jueves" };
    };
  };

  /// Etiqueta legible en español de un rango etario.
  public func ageRangeLabel(range : AgeRange) : Text {
    switch (range) {
      case (#nino0a5) { "Niño (0-5 años)" };
      case (#nino6a11) { "Niño (6-11 años)" };
      case (#nino12a13) { "Niño (12-13 años)" };
      case (#adolescente14a17) { "Adolescente (14-17 años)" };
      case (#adulto18mas) { "Adulto (18+ años)" };
    };
  };

  /// Etiqueta legible en español de un género.
  public func genderLabel(gender : Gender) : Text {
    switch (gender) {
      case (#femenino) { "Femenino" };
      case (#masculino) { "Masculino" };
    };
  };

  /// Mensaje legible en español de un error de validación.
  public func validationMessage(error : ValidationError) : Text {
    switch (error) {
      case (#invalidDate(msg)) { "Fecha inválida: " # msg };
      case (#negativeValue(msg)) { "Valor inválido: " # msg };
      case (#notFound(msg)) { "No encontrado: " # msg };
      case (#notAuthorized) { "No autorizado" };
    };
  };

  /// Detiene la ejecución con el mensaje del error de validación.
  public func trapValidation(error : ValidationError) : None {
    Runtime.trap(validationMessage(error));
  };
};
