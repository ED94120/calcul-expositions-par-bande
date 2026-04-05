import { APP_CONFIG } from "./config.js";
import { BAND_DEFINITIONS } from "./constants.js";
import { formatNumberForDisplay } from "./utils.js";
import { getVisibleBandKeys } from "./model.js";

export function cacheDom() {
  return {
    distanceInput: document.getElementById("distance3d"),
    distanceError: document.getElementById("distance3d-error"),
    modeFFSelect: document.getElementById("modeFF"),
    vitrageSelect: document.getElementById("vitrage"),
    bandsContainer: document.getElementById("bands-container"),
    expoFFInput: document.getElementById("expoFF"),
    expoFOInput: document.getElementById("expoFO"),
    expoTotaleInput: document.getElementById("expoTotale"),
    btnCopyFF: document.getElementById("btnCopyFF"),
    btnCopyFO: document.getElementById("btnCopyFO"),
    btnCopyTotale: document.getElementById("btnCopyTotale"),
    btnReset: document.getElementById("btnReset"),
    appMessage: document.getElementById("appMessage")
  };
}

export function createPireRow(bandKey, index) {
  const row = document.createElement("div");
  row.className = "pire-row";

  const label = document.createElement("label");
  label.className = "pire-index";
  label.setAttribute("for", `pire-${bandKey}-${index}`);
  label.textContent = String(index + 1);

  const input = document.createElement("input");
  input.type = "text";
  input.id = `pire-${bandKey}-${index}`;
  input.name = `pire-${bandKey}-${index}`;
  input.className = "field-input field-pire";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.dataset.bandKey = bandKey;
  input.dataset.pireIndex = String(index);
  input.setAttribute("aria-describedby", `pire-error-${bandKey}-${index}`);

  const error = document.createElement("div");
  error.id = `pire-error-${bandKey}-${index}`;
  error.className = "field-error pire-error";
  error.setAttribute("aria-live", "polite");

  row.append(label, input, error);
  return row;
}

export function createBandCard(bandKey, bandLabel) {
  const article = document.createElement("article");
  article.className = "band-card";
  article.id = `band-${bandKey}`;
  article.dataset.bandKey = bandKey;

  const header = document.createElement("header");
  header.className = "band-card-header";

  const h3 = document.createElement("h3");
  h3.className = "band-title";
  h3.textContent = bandLabel;

  const status = document.createElement("div");
  status.className = "band-status-message";
  status.id = `band-status-${bandKey}`;
  status.setAttribute("aria-live", "polite");

  header.append(h3, status);

  const body = document.createElement("div");
  body.className = "band-card-body";

  const sectionPire = document.createElement("section");
  sectionPire.className = "band-section";

  const pireTitle = document.createElement("div");
  pireTitle.className = "band-section-title";
  pireTitle.textContent = "PIRE (dBW)";

  const pireList = document.createElement("div");
  pireList.className = "pire-list";
  pireList.id = `pire-list-${bandKey}`;

  for (let i = 0; i < APP_CONFIG.nbMaxPireParBande; i += 1) {
    pireList.appendChild(createPireRow(bandKey, i));
  }

  sectionPire.append(pireTitle, pireList);

  const sectionAtt = document.createElement("section");
  sectionAtt.className = "band-section";

  const attLabel = document.createElement("label");
  attLabel.className = "band-section-title";
  attLabel.setAttribute("for", `att-${bandKey}`);
  attLabel.textContent = "Atténuation additionnelle (dB)";

  const attInput = document.createElement("input");
  attInput.type = "text";
  attInput.id = `att-${bandKey}`;
  attInput.name = `att-${bandKey}`;
  attInput.className = "field-input field-attenuation";
  attInput.inputMode = "decimal";
  attInput.autocomplete = "off";
  attInput.dataset.bandKey = bandKey;
  attInput.setAttribute("aria-describedby", `att-error-${bandKey}`);

  const attError = document.createElement("div");
  attError.id = `att-error-${bandKey}`;
  attError.className = "field-error";
  attError.setAttribute("aria-live", "polite");

  sectionAtt.append(attLabel, attInput, attError);

  const sectionExpo = document.createElement("section");
  sectionExpo.className = "band-section";

  const expoLabel = document.createElement("label");
  expoLabel.className = "band-section-title";
  expoLabel.setAttribute("for", `expo-${bandKey}`);
  expoLabel.textContent = "Exposition (V/m)";

  const expoInput = document.createElement("input");
  expoInput.type = "text";
  expoInput.id = `expo-${bandKey}`;
  expoInput.name = `expo-${bandKey}`;
  expoInput.className = "field-input field-calculated field-exposition";
  expoInput.readOnly = true;
  expoInput.tabIndex = -1;

  sectionExpo.append(expoLabel, expoInput);

  body.append(sectionPire, sectionAtt, sectionExpo);
  article.append(header, body);

  return article;
}

export function renderBandsContainer(state, dom) {
  dom.bandsContainer.innerHTML = "";
  const visibleBandKeys = getVisibleBandKeys(state.settings.modeFF);

  visibleBandKeys.forEach((bandKey) => {
    dom.bandsContainer.appendChild(
      createBandCard(bandKey, BAND_DEFINITIONS[bandKey].label)
    );
  });
}

export function populateBandInputsFromState(state) {
  const visibleBandKeys = getVisibleBandKeys(state.settings.modeFF);

  visibleBandKeys.forEach((bandKey) => {
    const band = state.bands[bandKey];

    band.pireTexts.forEach((value, index) => {
      const input = document.getElementById(`pire-${bandKey}-${index}`);
      if (input) input.value = value ?? "";
    });

    const attInput = document.getElementById(`att-${bandKey}`);
    if (attInput) attInput.value = band.attenuationText ?? "";

    const expoInput = document.getElementById(`expo-${bandKey}`);
    if (expoInput) {
      expoInput.value = formatNumberForDisplay(
        band.exposition,
        APP_CONFIG.nbDecimalesAffichage
      );
    }
  });
}

export function readInputsIntoState(state, dom) {
  state.settings.distanceText = dom.distanceInput.value;
  state.settings.modeFF = dom.modeFFSelect.value;
  state.settings.vitrage = dom.vitrageSelect.value;

  const visibleBandKeys = getVisibleBandKeys(state.settings.modeFF);

  visibleBandKeys.forEach((bandKey) => {
    const band = state.bands[bandKey];

    for (let i = 0; i < APP_CONFIG.nbMaxPireParBande; i += 1) {
      const input = document.getElementById(`pire-${bandKey}-${i}`);
      band.pireTexts[i] = input ? input.value : "";
    }

    const attInput = document.getElementById(`att-${bandKey}`);
    band.attenuationText = attInput ? attInput.value : "";
  });
}

export function clearDistanceError(dom) {
  dom.distanceInput.classList.remove("is-error");
  dom.distanceError.textContent = "";
}

export function setDistanceError(dom, message) {
  dom.distanceInput.classList.add("is-error");
  dom.distanceError.textContent = message;
}

export function clearPireFieldError(bandKey, index) {
  const input = document.getElementById(`pire-${bandKey}-${index}`);
  const error = document.getElementById(`pire-error-${bandKey}-${index}`);
  if (input) input.classList.remove("is-error");
  if (error) error.textContent = "";
}

export function setPireFieldError(bandKey, index, message) {
  const input = document.getElementById(`pire-${bandKey}-${index}`);
  const error = document.getElementById(`pire-error-${bandKey}-${index}`);
  if (input) input.classList.add("is-error");
  if (error) error.textContent = message;
}

export function clearAttenuationFieldError(bandKey) {
  const input = document.getElementById(`att-${bandKey}`);
  const error = document.getElementById(`att-error-${bandKey}`);
  if (input) input.classList.remove("is-error");
  if (error) error.textContent = "";
}

export function setAttenuationFieldError(bandKey, message) {
  const input = document.getElementById(`att-${bandKey}`);
  const error = document.getElementById(`att-error-${bandKey}`);
  if (input) input.classList.add("is-error");
  if (error) error.textContent = message;
}

export function clearBandErrorState(bandKey) {
  const card = document.getElementById(`band-${bandKey}`);
  const status = document.getElementById(`band-status-${bandKey}`);
  if (card) card.classList.remove("band-card-error");
  if (status) status.textContent = "";
}

export function setBandErrorState(bandKey, message) {
  const card = document.getElementById(`band-${bandKey}`);
  const status = document.getElementById(`band-status-${bandKey}`);
  if (card) card.classList.add("band-card-error");
  if (status) status.textContent = message;
}

export function resetVisualState(state, dom) {
  clearDistanceError(dom);

  getVisibleBandKeys(state.settings.modeFF).forEach((bandKey) => {
    clearBandErrorState(bandKey);
    clearAttenuationFieldError(bandKey);

    for (let i = 0; i < APP_CONFIG.nbMaxPireParBande; i += 1) {
      clearPireFieldError(bandKey, i);
    }
  });
}

export function renderGlobalResults(state, dom) {
  dom.expoFFInput.value = formatNumberForDisplay(
    state.results.expoFF,
    APP_CONFIG.nbDecimalesAffichage
  );
  dom.expoFOInput.value = formatNumberForDisplay(
    state.results.expoFO,
    APP_CONFIG.nbDecimalesAffichage
  );
  dom.expoTotaleInput.value = formatNumberForDisplay(
    state.results.expoTotale,
    APP_CONFIG.nbDecimalesAffichage
  );
}

export function renderErrors(state, dom) {
  if (state.errors.distance) {
    setDistanceError(dom, state.errors.distance);
  }

  getVisibleBandKeys(state.settings.modeFF).forEach((bandKey) => {
    const band = state.bands[bandKey];

    band.pireErrors.forEach((message, index) => {
      if (message) setPireFieldError(bandKey, index, message);
    });

    if (band.attenuationError) {
      setAttenuationFieldError(bandKey, band.attenuationError);
    }

    if (band.status === "erreur" && band.errorMessage) {
      setBandErrorState(bandKey, band.errorMessage);
    }
  });
}

export function showAppMessage(dom, message) {
  dom.appMessage.textContent = message;
  window.clearTimeout(showAppMessage._timer);
  showAppMessage._timer = window.setTimeout(() => {
    dom.appMessage.textContent = "";
  }, 1800);
}

export function renderApp(state, dom) {
  dom.distanceInput.value = state.settings.distanceText;
  dom.modeFFSelect.value = state.settings.modeFF;
  dom.vitrageSelect.value = state.settings.vitrage;

  renderBandsContainer(state, dom);
  populateBandInputsFromState(state);
  resetVisualState(state, dom);
  renderGlobalResults(state, dom);
  renderErrors(state, dom);
}
