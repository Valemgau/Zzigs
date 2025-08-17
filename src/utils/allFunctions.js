import { Alert, Linking } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { UPLOAD_PARAMS } from "../styles/constants";
import moment from "moment";
import "moment/locale/fr";

moment.locale("fr");


const CURRENCY = "FCFA";

// function addSeparatorToNumber(number) {
//   const separator = " ";
//   const numberString = number.toString();
//   const length = numberString.length;

//   let result = "";

//   for (let i = 0; i < length; i++) {
//     if (i > 0 && (length - i) % 3 === 0) {
//       result += separator;
//     }
//     result += numberString[i];
//   }

//   return result + " " + CURRENCY;
// }

const createUniqueUsername = (email) => {
  const baseUsername = email.split("@")[0];
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${baseUsername}${randomSuffix}`;
};

function addSeparatorToNumber(number) {
  const separator = " ";
  const numberString = number.toString().split("").reverse().join(""); // Inverse la chaîne
  const length = numberString.length;

  let result = "";

  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 3 === 0) {
      result += separator;
    }
    result += numberString[i];
  }

  return result.split("").reverse().join("") + " " + CURRENCY; // Inverse à nouveau pour remettre dans l'ordre
}

function anonymousUserName(isAgency, id) {
  // return `#user ${id}`;
  return isAgency ? `agency_${id.substr(0, 5)}` : `user_${id.substr(0, 5)}`;
}

// function cleanPrice(price) {
//   const cleanedPrice = price.replace(/[^\d.]/g, "");

//   const finalPrice = cleanedPrice.replace(/(\..*)\./g, "$1");

//   return parseFloat(finalPrice);
// }

function cleanPrice(price) {
  let finalPrice;

  if (typeof price === "number") {
    finalPrice = parseInt(price, 10);
  } else if (typeof price === "string") {
    const cleanedPrice = price.replace(/[^\d]/g, "");
    finalPrice = parseInt(cleanedPrice, 10);
  }

  return finalPrice;
}

const calculateAverageRatingFromArray = (ratingsArray) => {
  if (!Array.isArray(ratingsArray) || ratingsArray.length === 0) {
    return 0;
  }

  let totalRating = 0;
  let numberOfRatings = 0;

  ratingsArray.forEach((ratingData) => {
    if (ratingData.rate !== undefined && !isNaN(ratingData.rate)) {
      totalRating += ratingData.rate;
      numberOfRatings++;
    }
  });

  if (numberOfRatings === 0) {
    return 0;
  }

  const averageRating = totalRating / numberOfRatings;

  return averageRating;
};

function generateUniqueID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let uniqueID = "";

  // Générer les 4 premiers caractères (lettres)
  for (let i = 0; i < 4; i++) {
    const randomLetter = letters.charAt(
      Math.floor(Math.random() * letters.length)
    );
    uniqueID += randomLetter;
  }

  // Choisir une position aléatoire pour le chiffre (entre 0 et 4 inclus)
  const randomPosition = Math.floor(Math.random() * 5);

  // Insérer le chiffre à la position choisie
  uniqueID =
    uniqueID.slice(0, randomPosition) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    uniqueID.slice(randomPosition);

  return uniqueID;
}

const openSettings = async () => {
  const isSettingsAvailable = await Linking.canOpenURL("app-settings:");

  if (isSettingsAvailable) {
    await Linking.openSettings();
  } else {
    Alert.alert(
      "Paramètres non disponibles",
      "Impossible d'ouvrir les paramètres de l'application."
    );
  }
};

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

const imageCompressor = async (image) => {
  const res = await ImageManipulator.manipulateAsync(
    image,
    [{ resize: { width: UPLOAD_PARAMS.width / 2 } }],
    {
      compress: UPLOAD_PARAMS.compress,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return res.uri;
};

const formatNumber = (input, interval) => {
  let numbers = input.replace(/\s/g, "");

  let formatted = "";
  for (let i = 0; i < numbers.length; i++) {
    if (i !== 0 && i % interval === 0) {
      formatted += " ";
    }
    formatted += numbers[i];
  }

  return formatted;
};

const formatPrice = (input) => {
  let numbers = input.toString().replace(/\s/g, ""); // Convertit en chaîne de caractères et supprime les espaces existants

  let formatted = "";
  for (let i = numbers.length - 1, j = 1; i >= 0; i--, j++) {
    formatted = numbers[i] + formatted;
    if (j % 3 === 0 && i !== 0) {
      formatted = " " + formatted;
    }
  }

  return formatted;
};

const isPriceValid = (price) => {
  // Convertit en chaîne de caractères
  const strPrice = price.toString();

  // Liste des fins valides pour les prix
  const validEndings = [
    "000",
    "500",
    "0000",
    "5000",
    "00000",
    "50000",
    "000000",
  ];

  // Vérifie si le nombre se termine par l'un des suffixes valides
  return validEndings.some((ending) => strPrice.endsWith(ending));
};

function removeSpaces(input) {
  // Vérifie si l'entrée est une chaîne de caractères, sinon la convertit en une
  const str = typeof input === "string" ? input : String(input);

  // Remplace tous les espaces par une chaîne vide
  return str.replace(/\s+/g, "");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Génère un index aléatoire entre 0 et i
    [array[i], array[j]] = [array[j], array[i]]; // Échange les éléments aux indices i et j
  }
  return array;
}

function cleanString(input) {
  // Utilisation d'une expression régulière pour filtrer les caractères non souhaités
  return input.replace(/[^a-zA-Z0-9]/g, "");
}

const getFormattedDate = (inputDate) => {
  return moment(inputDate, "DD/MM/YYYY").format("dddd D MMMM");
};

// Fonction pour calculer la différence en jours entre aujourd'hui et une date donnée
const getDaysDifference = (inputDate) => {
  const today = moment(); // Date actuelle
  const targetDate = moment(inputDate, "DD/MM/YYYY");
  const daysDifference = targetDate.diff(today, "days");

  return daysDifference >= 0
    ? `dans ${daysDifference} jours`
    : `il y a ${Math.abs(daysDifference)} jours`;
};

export {
  shuffleArray,
  openSettings,
  addSeparatorToNumber,
  anonymousUserName,
  cleanPrice,
  calculateAverageRatingFromArray,
  emailRegex,
  CURRENCY,
  generateUniqueID,
  imageCompressor,
  formatNumber,
  getFormattedDate,
  getDaysDifference,
  formatPrice,
  isPriceValid,
  createUniqueUsername,
  removeSpaces,
  cleanString,
};
