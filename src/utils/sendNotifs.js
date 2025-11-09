import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function sendNotifs(user, message) {
  // Correction : utiliser message.body au lieu de message.desc
  const MESSAGE = {
    to: user.expoPushToken,
    sound: "default",
    title: message.title || "Notification",
    body: message.body || "",
    data: {
      type: message.type || null,
    },
  };

  const DATA_TO_ADD = {
    title: message.title || "Notification",
    text: message.body || "", // Correction : utiliser message.body
    userId: user.id,
    isNew: true,
    type: message.type || null,
    createdAt: serverTimestamp(), // Correction : utiliser serverTimestamp()
  };

  try {
    // Envoyer la notification push si le token existe
    if (user.expoPushToken) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(MESSAGE),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log("✅ Notification push envoyée avec succès !", result);
      } else {
        console.error("❌ Erreur lors de l'envoi de la notification push:", result);
      }
    } else {
      console.log("⚠️ Pas de token Expo, notification locale seulement.");
    }

    // Sauvegarder la notification dans Firestore
    await addDoc(collection(db, "notifications"), DATA_TO_ADD);
    console.log("✅ Notification sauvegardée dans Firestore");
    
  } catch (error) {
    console.error("❌ Erreur sendNotifs :", error);
    throw error; // Re-throw pour que l'appelant puisse gérer l'erreur
  }
}