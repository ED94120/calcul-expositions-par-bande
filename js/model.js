import { APP_CONFIG } from "./config.js";
import { BAND_DEFINITIONS, BAND_KEYS, MODE_FF, BAND_STATUS } from "./constants.js";

export function createEmptyBandState(bandKey) {
  return {
    key: bandKey,
    label: BAND_DEFINITIONS[bandKey].label,
    isFO: BAND_DEFINITIONS[bandKey].isFO,
    visible: false,
    pireTexts: Array(APP_CONFIG.nbMaxPireParBande).fill(""),
    attenuationText: "",
    pireErrors: Array(APP_CONFIG.nbMaxPireParBande).fill(""),
    attenuationError: "",
    status: BAND_STATUS.VIDE,
    errorMessage: "",
    parsedPireValuesDbw: [],
    parsedAttenuationDb: 0,
    pireTotalW: null,
    pireMajoreeW: null,
    attenuationVitrageDb: null,
    attenuationTotaleDb: null,
    attenuationTotaleLin: null,
    exposition: null
  };
}

export function getVisibleBandKeys(modeFF) {
  if (modeFF === MODE_FF.TROIS_BANDES) {
    return [BAND_KEYS.BF, BAND_KEYS.MF, BAND_KEYS.HF, BAND_KEYS.B3500];
  }
  return [BAND_KEYS.BF, BAND_KEYS.MF_HF, BAND_KEYS.B3500];
}

export function createInitialState() {
  const state = {
    settings: {
      distanceTextFF: "",
      distanceTextFO: "",
      modeFF: APP_CONFIG.modeFFParDefaut,
      vitrage: APP_CONFIG.vitrageParDefaut
    },
    bands: {
      [BAND_KEYS.BF]: createEmptyBandState(BAND_KEYS.BF),
      [BAND_KEYS.MF_HF]: createEmptyBandState(BAND_KEYS.MF_HF),
      [BAND_KEYS.MF]: createEmptyBandState(BAND_KEYS.MF),
      [BAND_KEYS.HF]: createEmptyBandState(BAND_KEYS.HF),
      [BAND_KEYS.B3500]: createEmptyBandState(BAND_KEYS.B3500)
    },
    results: {
      expoFF: null,
      expoFO: null,
      expoTotale: null
    },
    errors: {
      distanceFF: "",
      distanceFO: ""
    }
  };

  const visibleKeys = getVisibleBandKeys(state.settings.modeFF);
  Object.values(state.bands).forEach((band) => {
    band.visible = visibleKeys.includes(band.key);
  });

  return state;
}
