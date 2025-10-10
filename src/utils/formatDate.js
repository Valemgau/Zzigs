// utils/formatDate.js
export const formatDate = (date) => {
  if (!date) return "N/C";

  // Si Firestore renvoie un Timestamp
  const jsDate = date.toDate ? date.toDate() : new Date(date);

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", // lundi, mardi...
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(jsDate);
};
