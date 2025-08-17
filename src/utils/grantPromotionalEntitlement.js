import { REVENUE_CAT_SECRET_KEY } from "@env";

const grantPromotionalEntitlement = async (
  appUserId,
  entitlementIdentifier,
  durationInDays,
  duration
) => {
  // Récupère la clé API secrète depuis les variables d'environnement configurées
  // via react-native-config ou une alternative.
  // Assurez-vous que REVENUECAT_SECRET_API_KEY est défini dans votre fichier .env
  const REVENUECAT_SECRET_API_KEY = "sk_ijYWfqYMjCzQJxYTDSNqIHGUKOXbA";

  if (!REVENUECAT_SECRET_API_KEY) {
    console.error(
      "Erreur : La clé API secrète RevenueCat (REVENUECAT_SECRET_API_KEY) n'est pas configurée dans les variables d'environnement."
    );
    throw new Error("Clé API RevenueCat manquante.");
  }

  if (!appUserId || !entitlementIdentifier || !durationInDays) {
    console.error(
      "Erreur : appUserId, entitlementIdentifier et durationInDays sont requis."
    );
    throw new Error(
      "Paramètres manquants pour accorder l'entitlement promotionnel."
    );
  }

  const endpoint = `https://api.revenuecat.com/v1/subscribers/${appUserId}/entitlements/${entitlementIdentifier}/promotional`;

  // L'API v1 pour les promotions attend une durée (duration)
  // Options possibles : 'daily', 'weekly', 'monthly', 'yearly', etc. ou une durée personnalisée.
  // RevenueCat ne semble pas documenter publiquement un paramètre 'expiration_at' pour ce endpoint V1 spécifique,
  // mais plutôt 'duration'. Pour 10 jours, il n'y a pas de 'duration' standard.
  // On pourrait tenter d'utiliser 10 fois 'daily' mais ce n'est pas supporté.
  // La documentation suggère d'utiliser l'API Grants (https://docs.revenuecat.com/reference/grant-promotional-entitlement)
  // qui prend bien une 'duration'. Cependant, cette API pourrait nécessiter des permissions spécifiques.
  //
  // **Alternative potentielle (non garantie et peut nécessiter un ajustement) :**
  // Accorder un mois ('monthly') et stocker la vraie date d'expiration (maintenant + 10 jours)
  // dans votre propre base de données ou localement, puis vérifier cette date dans votre logique d'accès
  // EN PLUS de la vérification RevenueCat. Ce n'est PAS idéal.
  //
  // **La MEILLEURE approche reste un appel backend qui gère la logique de durée personnalisée.**
  //
  // **Tentative avec une durée standard la plus proche (ici 'monthly', ATTENTION, ce sera plus long que 10 jours):**
  // Si vous voulez IMPÉRATIVEMENT rester côté client malgré les risques et limitations,
  // vous pourriez accorder 'monthly' et gérer la fin des 10 jours vous-même, ou accepter
  // que l'utilisateur ait un accès plus long que prévu.
  // Pour cet exemple, nous allons utiliser 'monthly', mais ce N'EST PAS 10 jours.
  // Adaptez selon votre décision sur la gestion de la durée exacte.

  // *** IMPORTANT : Remplacer 'monthly' par la gestion de durée désirée si une meilleure méthode est trouvée/possible ***
  const requestBody = {
    duration: duration, // ATTENTION: Ceci accordera ~30 jours, pas 10.
    // store: 'promotional' // Il n'est généralement pas nécessaire de spécifier 'store' pour promotional
  };

  console.log(
    `Tentative d'octroi de l'entitlement '${entitlementIdentifier}' pour ${requestBody.duration} à l'utilisateur ${appUserId}`
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REVENUECAT_SECRET_API_KEY}`,
        "Content-Type": "application/json",
        "X-Platform": "react-native", // Header informatif optionnel
      },
      body: JSON.stringify(requestBody),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error(
        "Échec de l'octroi de l'entitlement promotionnel:",
        response.status,
        responseBody
      );
      // Essayez de fournir un message d'erreur plus spécifique si possible
      const errorMessage =
        responseBody?.message || `Erreur HTTP ${response.status}`;
      throw new Error(`Échec de l'octroi: ${errorMessage}`);
    }

    console.log("Entitlement promotionnel accordé avec succès:", responseBody);

    // Après l'appel réussi, vous devriez rafraîchir les Purchases/CustomerInfo dans votre app
    // pour refléter le nouvel état de l'entitlement.
    // Exemple : await Purchases.getCustomerInfo();

    return responseBody; // Contient les informations sur l'utilisateur mis à jour
  } catch (error) {
    console.error(
      "Erreur lors de l'appel API pour accorder l'entitlement:",
      error
    );
    // Renvoyer l'erreur pour une gestion ultérieure si nécessaire
    throw error;
  }
};

export default grantPromotionalEntitlement;
