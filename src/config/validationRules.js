/**
 * Règles de validation centralisées pour l'application
 * Permet de gérer facilement les contraintes de longueur minimale/maximale
 */

export const VALIDATION_RULES = {
  // Projets
  project: {
    minLength: 20,
    maxLength: 1000,
    fieldName: "projectDescription",
  },

  // Offres
  offerMessage: {
    minLength: 20,
    maxLength: 400,
    fieldName: "offerMessage",
  },

  // Budget
  budget: {
    min: 1,
    max: 100000,
  },

  // Prix d'offre
  offerPrice: {
    min: 0.01,
    max: 999999,
  },
};

/**
 * Valide une chaîne de caractères selon les règles définies
 * @param {string} value - La valeur à valider
 * @param {string} ruleName - Le nom de la règle (ex: 'project', 'offerMessage')
 * @returns {{ isValid: boolean, error: string|null, minLength: number, maxLength: number }}
 */
export const validateText = (value, ruleName) => {
  const rule = VALIDATION_RULES[ruleName];

  if (!rule) {
    return { isValid: true, error: null, minLength: 0, maxLength: Infinity };
  }

  const trimmedValue = value?.trim() || "";
  const length = trimmedValue.length;

  if (length === 0) {
    return {
      isValid: false,
      error: "required",
      minLength: rule.minLength,
      maxLength: rule.maxLength,
    };
  }

  if (length < rule.minLength) {
    return {
      isValid: false,
      error: "tooShort",
      minLength: rule.minLength,
      maxLength: rule.maxLength,
      currentLength: length,
    };
  }

  if (length > rule.maxLength) {
    return {
      isValid: false,
      error: "tooLong",
      minLength: rule.minLength,
      maxLength: rule.maxLength,
      currentLength: length,
    };
  }

  return {
    isValid: true,
    error: null,
    minLength: rule.minLength,
    maxLength: rule.maxLength,
    currentLength: length,
  };
};

/**
 * Valide un nombre selon les règles définies
 * @param {number} value - La valeur à valider
 * @param {string} ruleName - Le nom de la règle (ex: 'budget', 'offerPrice')
 * @returns {{ isValid: boolean, error: string|null, min: number, max: number }}
 */
export const validateNumber = (value, ruleName) => {
  const rule = VALIDATION_RULES[ruleName];

  if (!rule) {
    return { isValid: true, error: null, min: 0, max: Infinity };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: "invalid",
      min: rule.min,
      max: rule.max,
    };
  }

  if (numValue < rule.min) {
    return {
      isValid: false,
      error: "tooLow",
      min: rule.min,
      max: rule.max,
    };
  }

  if (numValue > rule.max) {
    return {
      isValid: false,
      error: "tooHigh",
      min: rule.min,
      max: rule.max,
    };
  }

  return {
    isValid: true,
    error: null,
    min: rule.min,
    max: rule.max,
  };
};
