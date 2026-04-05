import {
  BAND_STATUS,
  MAJ_PIRE_FF_DB,
  MAJ_PIRE_FO_DB,
  VITRAGE_ATT_DB,
  BAND_KEYS
} from "./constants.js";
import {
  isValidNumberText,
  parseLocalizedNumber,
  dbwToW,
  dbToLinear
} from "./utils.js";
import { getVisibleBandKeys } from "./model.js";

export function getVitrageAttenuationDb(vitrageKey) {
  return VITRAGE_ATT_DB[vitrageKey] ?? 0;
}

export function evaluateDistance(distanceText) {
  if (!isValidNumberText(distanceText)) {
    return { isValid: false, value: null, error: "Distance invalide" };
  }

  const value = parseLocalizedNumber(distanceText);
  if (!(value > 0)) {
    return { isValid: false, value: null, error: "Distance invalide" };
  }

  return { isValid: true, value, error: "" };
}

export function evaluateBand(band, distanceValue, vitrageKey) {
  const evaluated = {
    ...band,
    pireErrors: Array(band.pireTexts.length).fill(""),
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

  let hasPireError = false;

  evaluated.pireTexts.forEach((text, index) => {
    if (String(text).trim() === "") return;
    if (!isValidNumberText(text)) {
      evaluated.pireErrors[index] = "Valeur invalide";
      hasPireError = true;
      return;
    }
    evaluated.parsedPireValuesDbw.push(parseLocalizedNumber(text));
  });

  if (String(evaluated.attenuationText).trim() !== "") {
    if (!isValidNumberText(evaluated.attenuationText)) {
      evaluated.attenuationError = "Valeur invalide";
    } else {
      evaluated.parsedAttenuationDb = parseLocalizedNumber(evaluated.attenuationText);
    }
  }

  if (hasPireError || evaluated.attenuationError) {
    evaluated.status = BAND_STATUS.ERREUR;
    evaluated.errorMessage = "Corriger les champs en erreur";
    return evaluated;
  }

  if (evaluated.parsedPireValuesDbw.length === 0) {
    evaluated.status = BAND_STATUS.VIDE;
    return evaluated;
  }

  evaluated.status = BAND_STATUS.VALIDE;

  evaluated.pireTotalW = evaluated.parsedPireValuesDbw.reduce(
    (sum, dbw) => sum + dbwToW(dbw),
    0
  );

  const majDb = evaluated.isFO ? MAJ_PIRE_FO_DB : MAJ_PIRE_FF_DB;
  evaluated.pireMajoreeW = evaluated.pireTotalW * dbToLinear(majDb);

  evaluated.attenuationVitrageDb = getVitrageAttenuationDb(vitrageKey);
  evaluated.attenuationTotaleDb =
    evaluated.attenuationVitrageDb + evaluated.parsedAttenuationDb;
  evaluated.attenuationTotaleLin = dbToLinear(evaluated.attenuationTotaleDb);

  if (distanceValue != null) {
    evaluated.exposition =
      (1 / distanceValue) *
      Math.sqrt((30 * evaluated.pireMajoreeW) / evaluated.attenuationTotaleLin);
  }

  return evaluated;
}

export function hasVisibleBandError(state) {
  return getVisibleBandKeys(state.settings.modeFF).some(
    (bandKey) => state.bands[bandKey].status === BAND_STATUS.ERREUR
  );
}

export function computeExpoFF(state) {
  const ffKeys =
    state.settings.modeFF === "3bandes"
      ? [BAND_KEYS.BF, BAND_KEYS.MF, BAND_KEYS.HF]
      : [BAND_KEYS.BF, BAND_KEYS.MF_HF];

  const values = ffKeys
    .map((key) => state.bands[key].exposition)
    .filter((value) => value != null);

  if (values.length === 0) return null;

  return Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0));
}

export function computeExpoFO(state) {
  return state.bands[BAND_KEYS.B3500].exposition ?? null;
}

export function computeExpoTotale(expoFF, expoFO) {
  if (expoFF == null && expoFO == null) return null;
  if (expoFF != null && expoFO == null) return expoFF;
  if (expoFF == null && expoFO != null) return expoFO;
  return Math.sqrt(expoFF ** 2 + expoFO ** 2);
}

export function recomputeState(state) {
  const nextState = structuredClone(state);

  const visibleKeys = getVisibleBandKeys(nextState.settings.modeFF);
  Object.values(nextState.bands).forEach((band) => {
    band.visible = visibleKeys.includes(band.key);
  });

  const distanceEval = evaluateDistance(nextState.settings.distanceText);
  nextState.errors.distance = distanceEval.error;

  visibleKeys.forEach((bandKey) => {
    nextState.bands[bandKey] = evaluateBand(
      nextState.bands[bandKey],
      distanceEval.value,
      nextState.settings.vitrage
    );
    nextState.bands[bandKey].visible = true;
  });

  Object.keys(nextState.bands)
    .filter((bandKey) => !visibleKeys.includes(bandKey))
    .forEach((bandKey) => {
      nextState.bands[bandKey].visible = false;
      nextState.bands[bandKey].exposition = null;
      nextState.bands[bandKey].status = BAND_STATUS.VIDE;
      nextState.bands[bandKey].errorMessage = "";
      nextState.bands[bandKey].pireErrors = Array(nextState.bands[bandKey].pireTexts.length).fill("");
      nextState.bands[bandKey].attenuationError = "";
    });

  if (!distanceEval.isValid || hasVisibleBandError(nextState)) {
    nextState.results.expoFF = null;
    nextState.results.expoFO = null;
    nextState.results.expoTotale = null;
    return nextState;
  }

  nextState.results.expoFF = computeExpoFF(nextState);
  nextState.results.expoFO = computeExpoFO(nextState);
  nextState.results.expoTotale = computeExpoTotale(
    nextState.results.expoFF,
    nextState.results.expoFO
  );

  return nextState;
}
