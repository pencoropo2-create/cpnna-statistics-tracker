mixin () {
  public query func getApiDoc() : async Text {
    "# API del Registro Estadístico Semanal del CPNNA\n" #
    "\n" #
    "Backend Motoko para el registro estadístico diario y semanal del Consejo de Protección de Niños, Niñas y Adolescentes (CPNNA). Digitaliza el Formato 1 (actividades semanales / trámites), el Formato 2 (población atendida por edad y género) y expone totales, alertas de auditoría y el catálogo institucional de trámites.\n" #
    "\n" #
    "## Autenticación\n" #
    "\n" #
    "La aplicación usa Internet Identity. El frontend fija un *derivation origin* publicado en `/.well-known/ii-derivation-origin`; un agente que ya tenga autorización de Internet Identity del usuario debe derivar el principal correcto contra ese origen (por ejemplo `icp identity link web <nombre> --app <host>`). Esa delegación actúa con la autoridad completa del usuario en esta aplicación hasta que expire.\n" #
    "\n" #
    "## Autorización y registro\n" #
    "\n" #
    "La aplicación es privada y requiere aprobación del administrador. Un llamador directo a la API debe registrarse antes de cualquier llamada protegida:\n" #
    "\n" #
    "1. Llama una vez a `_initialize_access_control` como llamador firmado (no anónimo). El primer llamador recibe el rol de administrador; los llamadores posteriores reciben el rol de usuario.\n" #
    "2. Un administrador debe aprobar la cuenta. Hasta entonces, las llamadas protegidas fallan.\n" #
    "\n" #
    "Un principal puede estar sin registrar aunque la aplicación ya lo conozca: el registro solo ocurre cuando el llamador inicia sesión a través del frontend de la aplicación. Un principal que nunca lo hizo está sin registrar, incluso si pertenece al propietario de la aplicación, y un llamador firmado derivado contra otro origen es un principal distinto del que registró el frontend.\n" #
    "\n" #
    "- `createWeek`, `updateWeek` y `deleteWeek` requieren un llamador aprobado o administrador. Un llamador no aprobado recibe el trap `No autorizado: solo los usuarios aprobados pueden realizar esta acción`.\n" #
    "- `sendWeekReportEmail` también requiere un llamador aprobado o administrador y solo puede enviar semanas propias.\n" #
    "- `getWeek`, `listWeeks`, `getWeekTotals` y `getWeekAlerts` son consultas que devuelven solo los datos del llamador; un llamador sin datos recibe `null` o una lista vacía.\n" #
    "- `getAccessSummary` es una consulta disponible para cualquier llamador y describe su propio estado de acceso.\n" #
    "\n" #
    "## Unidades y codificación\n" #
    "\n" #
    "- `Timestamp` es `Int` en nanosegundos desde la época Unix (`Time.now()`).\n" #
    "- `WeekId` y `TramiteId` son `Nat`.\n" #
    "- `startDate` es texto en formato `AAAA-MM-DD`; debe ser un año entre 2000 y 2100, mes 1-12 y día 1-31.\n" #
    "- `WeekDay` es una variante con los días del ciclo Viernes a Jueves: `#viernes`, `#sabado`, `#domingo`, `#lunes`, `#martes`, `#miercoles`, `#jueves`.\n" #
    "- `AgeRange` es `#nino0a5`, `#nino6a11`, `#nino12a13`, `#adolescente14a17`, `#adulto18mas`.\n" #
    "- `Gender` es `#femenino` o `#masculino`.\n" #
    "- `ManagementIndicator` es `#seguimientoCausa`, `#expedientesAperturados` o `#entrevistas`.\n" #
    "- Los conteos son `Nat`; no se aceptan valores negativos.\n" #
    "\n" #
    "## Ciclo de vida y sondeo\n" #
    "\n" #
    "- `createWeek` devuelve el `WeekRecord` creado con su `id` asignado.\n" #
    "- `updateWeek` devuelve `?WeekRecord`: `null` si la semana no existe o no pertenece al llamador; el registro actualizado en caso contrario.\n" #
    "- `getWeekTotals` devuelve `?WeekTotals` con totales por día, por trámite y por rango etario, más `hasDiscrepancy`.\n" #
    "- `getWeekAlerts` devuelve las alertas de auditoría por día donde el total del Formato 1 no coincide con el del Formato 2.\n" #
    "- `listWeeks` devuelve resúmenes ordenados por `startDate` descendente.\n" #
    "- `sendWeekReportEmail(id, recipient)` envía el consolidado de la semana `id` al correo `recipient` y devuelve `#ok` o `#err(mensaje)`. El envío es una operación de actualización que realiza una llamada saliente; puede tardar varios segundos.\n" #
    "\n" #
    "## Seguridad de reintentos e idempotencia\n" #
    "\n" #
    "- `createWeek` no es idempotente: cada llamada crea una semana nueva con un `id` nuevo. Reintentar tras un error de red puede duplicar registros.\n" #
    "- `updateWeek` y `deleteWeek` son idempotentes respecto al `id`: repetir la misma llamada deja el mismo estado final.\n" #
    "- `deleteWeek` es destructivo: elimina permanentemente la semana del llamador y devuelve `true` si la eliminó, `false` si no existía o no le pertenecía.\n" #
    "- `sendWeekReportEmail` no es idempotente: cada llamada envía un correo nuevo. Reintentar tras un error de red puede enviar el consolidado más de una vez.\n" #
    "\n" #
    "## Errores y límites\n" #
    "\n" #
    "- Las entradas inválidas provocan un trap con un mensaje en español: fecha con formato incorrecto, año/mes/día fuera de rango, o trámite desconocido.\n" #
    "- Las operaciones de escritura sobre semanas ajenas devuelven `#notAuthorized` (trap) o `null`/`false` según el endpoint.\n" #
    "- El catálogo institucional (`listTramites`, `listIndicators`) es de solo lectura y no requiere aprobación.\n" #
    "\n" #
    "## Consultas OQL\n" #
    "\n" #
    "El backend expone `schema()` y `execute()` a través de OQL. La entidad `week` está limitada por usuario (`scopedPerUser`): cada llamador firmado lee solo sus propias semanas."
  };
};
