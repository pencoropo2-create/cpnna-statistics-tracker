import Types "../types/catalog";
import CatalogLib "../lib/catalog";

mixin () {
  /// Devuelve el catálogo completo de trámites y medidas.
  public query func listTramites() : async [Types.Tramite] {
    CatalogLib.listTramites();
  };

  /// Devuelve los indicadores de gestión soportados.
  public query func listIndicators() : async [Types.ManagementIndicator] {
    CatalogLib.listIndicators();
  };
};
