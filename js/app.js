import { APP_CONFIG } from "./config.js";
import { BAND_KEYS, MODE_FF } from "./constants.js";
import { createInitialState } from "./model.js";
import { recomputeState } from "./calculs.js";
import {
  cacheDom,
  readInputsIntoState,
  renderApp,
  showAppMessage,
  populateSiteAnalogueSelect,
  renderSiteAnalogueInfo,
  clearBandFields,
  clearGlobalResults,
  writePireValuesToBand,
  resetSiteAnalogueSelection
} from "./ui.js";
import { copyTextToClipboard, formatNumberForCopy } from "./utils.js";

let state = null;
let dom = null;
let isBulkUpdating = false;

function syncAndRecompute() {
  if (isBulkUpdating) return;
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
    clearBandData(stateObj, BAND_KEYS.MF_HF);
  } else {
    clearBandData(stateObj, BAND_KEYS.MF);
    clearBandData(stateObj, BAND_KEYS.HF);
  }
}

function getSitesPireAnalogues() {
  return Array.isArray(window.sitesPireAnalogues) ? window.sitesPireAnalogues : [];
}

function findSiteById(siteId) {
  return getSitesPireAnalogues().find((site) => site.id === siteId) ?? null;
}

function mapSitePiresToBands(site, modeFF) {
  const p = site?.pires ?? {};

  const bfValues = [
    p["2G900"],
    p["3G900"],
    p["4G700"],
    p["5G700"],
    p["4G800"]
  ];

  const b3500Values = [
    p["5G3500"]
  ];

  if (modeFF === MODE_FF.TROIS_BANDES) {
    return {
      [BAND_KEYS.BF]: bfValues,
      [BAND_KEYS.MF]: [
        p["4G1800"],
        p["3G2100"],
        p["4G2100"],
        p["5G2100"]
      ],
      [BAND_KEYS.HF]: [
        p["4G2600"]
      ],
      [BAND_KEYS.B3500]: b3500Values
    };
  }

  return {
    [BAND_KEYS.BF]: bfValues,
    [BAND_KEYS.MF_HF]: [
      p["4G1800"],
      p["3G2100"],
      p["4G2100"],
      p["5G2100"],
      p["4G2600"]
    ],
    [BAND_KEYS.B3500]: b3500Values
  };
}

function clearAllPireFieldsAndResults() {
  isBulkUpdating = true;

  clearBandFields(state);
  clearGlobalResults(dom);
  renderSiteAnalogueInfo(dom, "");
  resetSiteAnalogueSelection(dom);

  readInputsIntoState(state, dom);

  Object.values(state.bands).forEach((band) => {
    band.pireTexts = Array(APP_CONFIG.nbMaxPireParBande).fill("");
    band.attenuationText = "";
    band.exposition = null;
    band.pireErrors = Array(APP_CONFIG.nbMaxPireParBande).fill("");
    band.attenuationError = "";
    band.status = "vide";
    band.errorMessage = "";
  });

  state.results.expoFF = null;
  state.results.expoFO = null;
  state.results.expoTotale = null;

  isBulkUpdating = false;
  state = recomputeState(state);
  renderApp(state, dom);
}

function loadSiteAnalogue(siteId) {
  const site = findSiteById(siteId);

  if (!site) {
    renderSiteAnalogueInfo(dom, "");
    return;
  }

  readInputsIntoState(state, dom);

  const mapped = mapSitePiresToBands(site, state.settings.modeFF);

  isBulkUpdating = true;

  clearBandFields(state);
  clearGlobalResults(dom);

  Object.entries(mapped).forEach(([bandKey, values]) => {
    writePireValuesToBand(bandKey, values);
  });

  renderSiteAnalogueInfo(dom, `Exemple chargé : ${site.label}`);

  isBulkUpdating = false;
  syncAndRecompute();
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

  if (dom.selectSiteAnalogue && dom.selectSiteAnalogue.value) {
    loadSiteAnalogue(dom.selectSiteAnalogue.value);
  }
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
  dom.distanceFFInput.addEventListener("change", syncAndRecompute);
  dom.distanceFOInput.addEventListener("change", syncAndRecompute);
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

  if (dom.selectSiteAnalogue) {
    dom.selectSiteAnalogue.addEventListener("change", (event) => {
      const siteId = event.target.value;

      if (!siteId) {
        renderSiteAnalogueInfo(dom, "");
        return;
      }

      loadSiteAnalogue(siteId);
    });
  }

  if (dom.btnEffacerPIRE) {
    dom.btnEffacerPIRE.addEventListener("click", () => {
      clearAllPireFieldsAndResults();
      showAppMessage(dom, "PIRE effacées");
    });
  }

  dom.btnCopyFF.addEventListener("click", () => handleCopy(state.results.expoFF));
  dom.btnCopyFO.addEventListener("click", () => handleCopy(state.results.expoFO));
  dom.btnCopyTotale.addEventListener("click", () => handleCopy(state.results.expoTotale));

  dom.btnReset.addEventListener("click", () => {
    state = createInitialState();
    state = recomputeState(state);
    renderApp(state, dom);
    resetSiteAnalogueSelection(dom);
    renderSiteAnalogueInfo(dom, "");
    showAppMessage(dom, "");
  });
}

function init() {
  dom = cacheDom();
  state = createInitialState();
  state = recomputeState(state);
  renderApp(state, dom);

  populateSiteAnalogueSelect(dom, getSitesPireAnalogues());

  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);
