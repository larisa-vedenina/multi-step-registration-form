document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mainForm");
  const submitBtn = document.getElementById("submitBtn");
  const captchaGroup = document.getElementById("captchaGroup");
  const captchaText = document.getElementById("captchaText");
  const refreshBtn = document.getElementById("refreshCaptcha");
  const loadingGroup = document.getElementById("loadingGroup");
  const smsGroup = document.getElementById("smsGroup");
  const smsCodeNote = document.getElementById("smsCodeNote");
  const statusText = document.getElementById("formStatus");
  const countryCodeSelect = document.getElementById("countryCodeSelect");
  const countryCodeValue = document.getElementById("countryCodeValue");
  const countryMenu = document.getElementById("countryMenu");

  // Поля формы
  const createField = (inputId, wrapperId, errorId) => ({
    input: document.getElementById(inputId),
    wrapper: document.getElementById(wrapperId),
    error: document.getElementById(errorId),
  });

  const fields = {
    firstName: createField("firstName", "firstNameWrapper", "firstNameError"),
    lastName: createField("lastName", "lastNameWrapper", "lastNameError"),
    email: createField("email", "emailWrapper", "emailError"),
    phone: createField("phone", "phoneWrapper", "phoneError"),
    captcha: createField("captchaInput", "captchaWrapper", "captchaError"),
    sms: createField("smsCode", "smsWrapper", "smsError"),
  };

  const mainFieldNames = ["firstName", "lastName", "email", "phone"];
  const verificationFieldNames = [...mainFieldNames, "captcha"];
  // Страны для кода номера
  const countries = [
    { region: "CA", label: "Canada", code: "+1" },
    { region: "FI", label: "Finland", code: "+358" },
    { region: "FR", label: "France", code: "+33" },
    { region: "DE", label: "Germany", code: "+49" },
    { region: "IT", label: "Italy", code: "+39" },
    { region: "KZ", label: "Kazakhstan", code: "+7" },
    { region: "PL", label: "Poland", code: "+48" },
    { region: "RU", label: "Russia", code: "+7" },
    { region: "ES", label: "Spain", code: "+34" },
    { region: "SE", label: "Sweden", code: "+46" },
    { region: "UA", label: "Ukraine", code: "+380" },
    { region: "GB", label: "United Kingdom", code: "+44" },
    { region: "US", label: "United States", code: "+1" },
  ];
  const state = {
    touched: new Set(),
    captchaCode: "",
    smsCode: "",
    isSubmitting: false,
    smsStepVisible: false,
    selectedCountry:
      countries.find(({ region }) => region === "US") || countries[0],
  };

  // Валидация полей
  const validators = {
    firstName(value) {
      if (!value) return "Required";
      if (value.length < 2) return "Min. 2 letters";
      return "";
    },
    lastName(value) {
      if (!value) return "Required";
      if (value.length < 2) return "Min. 2 letters";
      return "";
    },
    email(value) {
      if (!value) return "Required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Invalid email";
      return "";
    },
    phone(value) {
      if (!value) return "Required";
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10) return "Min. 10 digits";
      return "";
    },
    captcha(value) {
      if (!value) return "Required";
      if (value !== state.captchaCode) return "Incorrect code";
      return "";
    },
    sms(value) {
      if (!value) return "Required";
      if (!/^\d{4}$/.test(value)) return "4 digits";
      if (value !== state.smsCode) return "Incorrect code";
      return "";
    },
  };

  function getNormalizedValue(fieldName) {
    const value = fields[fieldName].input.value.trim();

    if (fieldName === "captcha") {
      return value.replace(/\s+/g, "").toUpperCase();
    }

    if (fieldName === "sms") {
      return value.replace(/\D/g, "");
    }

    return value;
  }

  function setFieldError(fieldName, message) {
    const field = fields[fieldName];
    const hasError = Boolean(message);

    field.wrapper.classList.toggle("error", hasError);
    field.input.setAttribute("aria-invalid", hasError ? "true" : "false");
    field.error.textContent = message;
  }

  function validateField(fieldName, forceDisplay = false) {
    const message = validators[fieldName](getNormalizedValue(fieldName));

    if (forceDisplay || state.touched.has(fieldName)) {
      setFieldError(fieldName, message);
    } else if (!message) {
      setFieldError(fieldName, "");
    }

    return message === "";
  }

  function areMainFieldsValid() {
    return mainFieldNames.every(
      (fieldName) => validators[fieldName](getNormalizedValue(fieldName)) === "",
    );
  }

  function isCaptchaValid() {
    return !captchaGroup.hidden && validators.captcha(getNormalizedValue("captcha")) === "";
  }

  function updateSubmitState() {
    const readyToSubmit = state.smsStepVisible
      ? validators.sms(getNormalizedValue("sms")) === "" && !state.isSubmitting
      : areMainFieldsValid() && isCaptchaValid() && !state.isSubmitting;

    submitBtn.disabled = !readyToSubmit;
    submitBtn.textContent = state.smsStepVisible ? "Verify Code" : "Register Now";
  }

  function focusFirstInvalidField() {
    const fieldsToCheck = state.smsStepVisible ? ["sms"] : verificationFieldNames;
    const firstInvalidField = fieldsToCheck.find((fieldName) => {
      if (fieldName === "captcha" && captchaGroup.hidden) return false;
      return validators[fieldName](getNormalizedValue(fieldName)) !== "";
    });

    if (firstInvalidField) {
      fields[firstInvalidField].input.focus();
    }
  }

  // Выбор кода страны
  function getCountryByRegion(regionCode) {
    return (
      countries.find(({ region }) => region === regionCode) ||
      countries.find(({ region }) => region === "US") ||
      countries[0]
    );
  }

  function getRegionFromLocale(locale) {
    if (!locale) return "";

    const normalizedLocale = locale.replace("_", "-");
    const parts = normalizedLocale.split("-");

    return parts.length > 1 ? parts[1].toUpperCase() : "";
  }

  function getDefaultCountry() {
    const locales = [...(navigator.languages || []), navigator.language].filter(Boolean);

    for (const locale of locales) {
      const regionCode = getRegionFromLocale(locale);

      if (regionCode) {
        return getCountryByRegion(regionCode);
      }
    }

    return getCountryByRegion("US");
  }

  function updateCountryOptions() {
    countryMenu.querySelectorAll(".country-option").forEach((option) => {
      const isActive = option.dataset.country === state.selectedCountry.region;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function setCountry(country, { announce = false } = {}) {
    state.selectedCountry = country;
    countryCodeValue.textContent = country.code;
    fields.phone.input.setAttribute(
      "aria-label",
      `Phone number, country code ${country.code}`,
    );
    updateCountryOptions();

    if (announce) {
      statusText.textContent = `${country.label} country code selected.`;
    }
  }

  function closeCountryMenu() {
    countryMenu.hidden = true;
    countryCodeSelect.setAttribute("aria-expanded", "false");
  }

  function openCountryMenu() {
    countryMenu.hidden = false;
    countryCodeSelect.setAttribute("aria-expanded", "true");
  }

  // Капча
  function generateCaptcha() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    state.captchaCode = Array.from({ length: 6 }, () => {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      return alphabet[randomIndex];
    }).join("");

    captchaText.textContent = state.captchaCode.split("").join(" ");
    captchaText.setAttribute(
      "aria-label",
      `Verification code ${state.captchaCode.split("").join(" ")}`,
    );

    fields.captcha.input.value = "";
    setFieldError("captcha", "");
    updateSubmitState();
  }

  // SMS-код
  function generateSmsCode() {
    state.smsCode = String(Math.floor(1000 + Math.random() * 9000));
    smsCodeNote.textContent = `Code: ${state.smsCode}`;
  }

  // Состояние интерактивности формы
  function syncInteractiveState() {
    const lockPrimaryStep = state.smsStepVisible || state.isSubmitting;

    mainFieldNames.forEach((fieldName) => {
      fields[fieldName].input.disabled = lockPrimaryStep;
    });

    fields.captcha.input.disabled =
      captchaGroup.hidden || state.smsStepVisible || state.isSubmitting;
    fields.sms.input.disabled = !state.smsStepVisible || state.isSubmitting;
    refreshBtn.disabled = state.smsStepVisible || state.isSubmitting;
    countryCodeSelect.disabled = state.smsStepVisible || state.isSubmitting;

    countryMenu.querySelectorAll(".country-option").forEach((option) => {
      option.disabled = state.smsStepVisible || state.isSubmitting;
    });

    if (state.smsStepVisible || state.isSubmitting) {
      closeCountryMenu();
    }
  }

  function showSmsStep() {
    state.smsStepVisible = true;
    state.isSubmitting = false;
    form.setAttribute("aria-busy", "false");
    captchaGroup.hidden = true;
    loadingGroup.hidden = true;
    smsGroup.hidden = false;
    generateSmsCode();
    fields.captcha.input.value = "";
    state.touched.delete("captcha");
    setFieldError("captcha", "");
    fields.sms.input.value = "";
    state.touched.delete("sms");
    setFieldError("sms", "");
    statusText.textContent = "SMS code is ready.";
    syncInteractiveState();
    updateSubmitState();
    fields.sms.input.focus();
  }

  function updateCaptchaVisibility() {
    const shouldShowCaptcha =
      areMainFieldsValid() && !state.isSubmitting && !state.smsStepVisible;

    if (shouldShowCaptcha && captchaGroup.hidden) {
      captchaGroup.hidden = false;
      generateCaptcha();
      statusText.textContent = "Verification step is available.";
    }

    if (!shouldShowCaptcha && !captchaGroup.hidden) {
      captchaGroup.hidden = true;
      fields.captcha.input.value = "";
      state.touched.delete("captcha");
      setFieldError("captcha", "");
      statusText.textContent = "";
    }

    syncInteractiveState();
    updateSubmitState();
  }

  function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    form.setAttribute("aria-busy", isSubmitting ? "true" : "false");
    syncInteractiveState();
    updateSubmitState();
  }

  function storeProfile() {
    const phoneValue = getNormalizedValue("phone");
    const profile = {
      firstName: getNormalizedValue("firstName"),
      lastName: getNormalizedValue("lastName"),
      email: getNormalizedValue("email"),
      countryCode: state.selectedCountry.code,
      phone: `${state.selectedCountry.code} ${phoneValue}`.trim(),
    };

    try {
      sessionStorage.setItem("registrationProfile", JSON.stringify(profile));
    } catch {
    }
  }

  function handleMainFieldInput(fieldName) {
    if (fieldName === "phone") {
      fields.phone.input.value = fields.phone.input.value.replace(/[^\d\s()+-]/g, "");
    }

    if (state.smsStepVisible) {
      return;
    }

    if (state.touched.has(fieldName)) {
      validateField(fieldName, true);
    }

    updateCaptchaVisibility();
  }

  // Обработчики полей
  function handleFieldBlur(fieldName) {
    state.touched.add(fieldName);
    validateField(fieldName, true);

    if (fieldName === "captcha" || fieldName === "sms") {
      updateSubmitState();
      return;
    }

    updateCaptchaVisibility();
  }

  mainFieldNames.forEach((fieldName) => {
    const field = fields[fieldName].input;

    field.addEventListener("input", () => handleMainFieldInput(fieldName));
    field.addEventListener("blur", () => handleFieldBlur(fieldName));
  });

  fields.captcha.input.addEventListener("input", () => {
    fields.captcha.input.value = fields.captcha.input.value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    if (state.touched.has("captcha")) {
      validateField("captcha", true);
    }

    updateSubmitState();
  });

  fields.captcha.input.addEventListener("blur", () => handleFieldBlur("captcha"));

  fields.sms.input.addEventListener("input", () => {
    fields.sms.input.value = fields.sms.input.value.replace(/\D/g, "").slice(0, 4);

    if (state.touched.has("sms")) {
      validateField("sms", true);
    }

    updateSubmitState();
  });

  fields.sms.input.addEventListener("blur", () => handleFieldBlur("sms"));

  refreshBtn.addEventListener("click", () => {
    generateCaptcha();
    statusText.textContent = "Verification code updated.";
    fields.captcha.input.focus();
  });

  countryCodeSelect.addEventListener("click", () => {
    if (countryMenu.hidden) {
      openCountryMenu();
      return;
    }

    closeCountryMenu();
  });

  countryMenu.addEventListener("click", (event) => {
    const option = event.target.closest(".country-option");

    if (!option) return;

    setCountry(getCountryByRegion(option.dataset.country), { announce: true });
    closeCountryMenu();
    fields.phone.input.focus();
  });

  document.addEventListener("click", (event) => {
    if (
      countryMenu.hidden ||
      countryMenu.contains(event.target) ||
      countryCodeSelect.contains(event.target)
    ) {
      return;
    }

    closeCountryMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCountryMenu();
    }
  });

  // Отправка формы
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.smsStepVisible) {
      state.touched.add("sms");

      if (!validateField("sms", true)) {
        statusText.textContent = "Please enter the correct SMS code.";
        fields.sms.input.focus();
        updateSubmitState();
        return;
      }

      loadingGroup.hidden = false;
      statusText.textContent = "Code accepted. Opening the next step.";
      storeProfile();
      setSubmitting(true);

      window.setTimeout(() => {
        window.location.href = "thanks.html";
      }, 1200);
      return;
    }

    verificationFieldNames.forEach((fieldName) => state.touched.add(fieldName));

    const mainFieldsAreValid = mainFieldNames.every((fieldName) =>
      validateField(fieldName, true),
    );

    updateCaptchaVisibility();

    const captchaIsValid = !captchaGroup.hidden && validateField("captcha", true);

    if (!mainFieldsAreValid || !captchaIsValid) {
      statusText.textContent = "Please check the highlighted fields.";
      focusFirstInvalidField();
      updateSubmitState();
      return;
    }

    captchaGroup.hidden = true;
    loadingGroup.hidden = false;
    statusText.textContent = "Details accepted. Preparing SMS confirmation.";
    setSubmitting(true);

    window.setTimeout(() => {
      showSmsStep();
    }, 900);
  });

  setCountry(getDefaultCountry());
  syncInteractiveState();
  updateCaptchaVisibility();
});
