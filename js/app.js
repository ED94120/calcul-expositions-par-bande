import { APP_CONFIG } from "./config.js";
import { BAND_KEYS, MODE_FF } from "./constants.js";
import { createInitialState } from "./model.js";
import { recomputeState } from "./calculs.js";
import {
  cacheDom,
  readInputsIntoState,
  renderApp,
  showAppMessage
} from "./ui.js";
import { copyTextToClipboard, formatNumberForCopy } from "./utils.js";

let state = null;
let dom = null;

function syncAndRecompute() {
  readInputsIntoState(state, dom);
  state = recomputeState(state);
  renderApp(state, dom);
}

function bandHasData(stateObj, bandKey) {
  const band = stateObj.bands[bandKey];
  const hasPire = band.pireTexts.some((value) => String(value).trim() !== "");
  const hasAtt = String(band.attenuationText).trim() !== "";
  return hasPire || hasAtt;
}

function modeChangeCausesDataLoss(stateObj, nextMode) {
  const currentMode = stateObj.settings.modeFF;
  if (currentMode === nextMode) return false;

  if (currentMode === MODE_FF.DEUX_BANDES && nextMode === MODE_FF.TROIS_BANDES) {
    return bandHasData(stateObj, BAND_KEYS.MF_HF);
  }

  if (currentMode === MODE_FF.TROIS_BANDES && nextMode === MODE_FF.DEUX_BANDES) {
    return (
      bandHasData(stateObj, BAND_KEYS.MF) ||
      bandHasData(stateObj, BAND_KEYS.HF)
    );
  }

  return false;
}

function clearBandData(stateObj, bandKey) {
  stateObj.bands[bandKey].pireTexts = Array(APP_CONFIG.nbMaxPireParBande).fill("");
  stateObj.bands[bandKey].attenuationText = "";
}

function clearIncompatibleBandsForMode(stateObj, nextMode) {
  if (nextMode === MODE_FF.TROIS_BANDES) {
    clearBandData(stateObj, BAND_KEYS.MF);
    clearBandData(stateObj, BAND_KEYS.HF);
  } else {
    clearBandData(stateObj, BAND_KEYS.MF_HF);
  }
}

function handleModeChange(nextMode) {
  const currentMode = state.settings.modeFF;
  if (nextMode === currentMode) return;

  if (modeChangeCausesDataLoss(state, nextMode)) {
    const ok = window.confirm(
      "Le changement de découpage des bandes effacera certaines saisies incompatibles. Continuer ?"
    );
    if (!ok) {
      dom.modeFFSelect.value = currentMode;
      return;
    }
  }

  readInputsIntoState(state, dom);
  state.settings.modeFF = nextMode;
  clearIncompatibleBandsForMode(state, nextMode);
  state = recomputeState(state);
  renderApp(state, dom);
}

async function handleCopy(value) {
  if (value == null) {
    showAppMessage(dom, "Aucune valeur à copier");
    return;
  }

  try {
    await copyTextToClipboard(
      formatNumberForCopy(value, APP_CONFIG.nbDecimalesAffichage)
    );
    showAppMessage(dom, "Valeur copiée");
  } catch {
    showAppMessage(dom, "Copie impossible");
  }
}

function bindEvents() {
  dom.distanceInput.addEventListener("change", syncAndRecompute);
  dom.vitrageSelect.addEventListener("change", syncAndRecompute);

  dom.modeFFSelect.addEventListener("change", (event) => {
    handleModeChange(event.target.value);
  });

  dom.bandsContainer.addEventListener("change", (event) => {
    if (
      event.target.classList.contains("field-pire") ||
      event.target.classList.contains("field-attenuation")
    ) {
      syncAndRecompute();
    }
  });

  dom.btnCopyFF.addEventListener("click", () => handleCopy(state.results.expoFF));
  dom.btnCopyFO.addEventListener("click", () => handleCopy(state.results.expoFO));
  dom.btnCopyTotale.addEventListener("click", () => handleCopy(state.results.expoTotale));

  dom.btnReset.addEventListener("click", () => {
    state = createInitialState();
    state = recomputeState(state);
    renderApp(state, dom);
    showAppMessage(dom, "");
  });
}

function init() {
  dom = cacheDom();
  state = createInitialState();
  state = recomputeState(state);
  renderApp(state, dom);
  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);
