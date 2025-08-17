import firestore from '@react-native-firebase/firestore';

/**
 * Met à jour le nombre de pièces d'un utilisateur spécifique dans Firestore.
 * Augmente ou diminue le nombre de pièces actuel par le montant spécifié.
 *
 * @param {string} userId - L'identifiant unique (UID) de l'utilisateur dont les pièces doivent être mises à jour.
 * @param {number} amount - Le nombre de pièces à ajouter. Utilisez un nombre négatif pour retirer des pièces.
 * @returns {Promise<void>} Une promesse qui se résout une fois la mise à jour terminée ou rejette en cas d'erreur.
 */
const updateUserCoins = async (userId, amount) => {
  // Vérification simple des entrées
  if (!userId || typeof userId !== 'string') {
    console.error("L'ID utilisateur est invalide.");
    throw new Error("L'ID utilisateur est invalide.");
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
     console.error("Le montant est invalide.");
     throw new Error("Le montant est invalide.");
  }

  // Référence au document de l'utilisateur dans la collection 'users'
  // Assurez-vous que votre collection s'appelle bien 'users' ou adaptez le nom.
  const userDocRef = firestore().collection('users').doc(userId);

  try {
    // Met à jour le champ 'coins' en ajoutant la valeur 'amount'
    // firestore.FieldValue.increment() gère l'ajout atomique [5]
    await userDocRef.update({
      pieces: firestore.FieldValue.increment(amount)
    });
    console.log(`Nombre de pièces mis à jour pour l'utilisateur ${userId}. Montant ajouté/retiré : ${amount}`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des pièces pour l'utilisateur ${userId}:`, error);
    // Propager l'erreur pour une gestion ultérieure si nécessaire
    throw error;
  }
};

// --- Exemple d'utilisation ---

/*
// Pour obtenir l'ID de l'utilisateur actuellement connecté (si vous utilisez Firebase Auth)
import auth from '@react-native-firebase/auth';
const currentUser = auth().currentUser;
if (currentUser) {
  const userId = currentUser.uid;

  // Pour ajouter 10 pièces :
  updateUserCoins(userId, 10)
    .then(() => console.log("Ajout de 10 pièces réussi."))
    .catch(err => console.error("Échec de l'ajout de pièces:", err));

  // Pour retirer 5 pièces :
  // updateUserCoins(userId, -5)
  //  .then(() => console.log("Retrait de 5 pièces réussi."))
  //  .catch(err => console.error("Échec du retrait de pièces:", err));

} else {
  console.log("Aucun utilisateur connecté.");
}
*/

export default updateUserCoins; // Pour pouvoir l'importer dans d'autres fichiers
