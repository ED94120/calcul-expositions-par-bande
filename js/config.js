export const APP_CONFIG = {
  // Important : le chargement automatique des sites analogues suppose au minimum
  // 5 lignes de PIRE par bande. Une valeur inférieure tronquerait certaines
  // technologies (ex. BF : 2G900, 3G900, 4G700, 5G700, 4G800).
  nbMaxPireParBande: 5,
  nbDecimalesAffichage: 2,
  modeFFParDefaut: "2bandes",
  vitrageParDefaut: "simple"
};
