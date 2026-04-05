export const BAND_KEYS = {
  BF: "BF",
  MF_HF: "MF_HF",
  MF: "MF",
  HF: "HF",
  B3500: "B3500"
};

export const MODE_FF = {
  DEUX_BANDES: "2bandes",
  TROIS_BANDES: "3bandes"
};

export const VITRAGE_KEYS = {
  EXTERIEUR: "exterieur",
  SIMPLE: "simple",
  DOUBLE: "double",
  FAIBLE_EMISSIVITE: "faible_emissivite"
};

export const BAND_STATUS = {
  VIDE: "vide",
  VALIDE: "valide",
  ERREUR: "erreur"
};

export const MAJ_PIRE_FF_DB = 4;
export const MAJ_PIRE_FO_DB = 14.75;

export const VITRAGE_ATT_DB = {
  [VITRAGE_KEYS.EXTERIEUR]: 0,
  [VITRAGE_KEYS.SIMPLE]: 2,
  [VITRAGE_KEYS.DOUBLE]: 3.8,
  [VITRAGE_KEYS.FAIBLE_EMISSIVITE]: 25
};

export const BAND_DEFINITIONS = {
  [BAND_KEYS.BF]: {
    label: "BF 690 - 960 MHz",
    isFO: false
  },
  [BAND_KEYS.MF_HF]: {
    label: "MF/HF 1427 - 2690 MHz",
    isFO: false
  },
  [BAND_KEYS.MF]: {
    label: "MF 1427 - 2200 MHz",
    isFO: false
  },
  [BAND_KEYS.HF]: {
    label: "HF 2490 - 2690 MHz",
    isFO: false
  },
  [BAND_KEYS.B3500]: {
    label: "3500 MHz",
    isFO: true
  }
};
