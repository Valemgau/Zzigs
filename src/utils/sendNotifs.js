import firestore from "@react-native-firebase/firestore";
import moment from "moment";


export default async function sendNotifs(user, message) {
  // Préparer la notification push
  const MESSAGE = {
    to: user.expoPushToken,
    sound: "default",
    title: `${message.title}`,
    body: `${message.desc}`,
  };

  // Données à enregistrer dans Firestore
  const DATA_TO_ADD = {
    title: `${message.title}`,
    text: `${message.desc}`,
    userId: `${user.id}`,
    isNew: true,
    type: 
      !message.type ||
      message.type == null ||
      message.type == "" ||
      message.type == undefined
        ? null
        : message.type,
    createdAt: moment().format(), // Timestamp formaté
  };

  try {
    if (user.expoPushToken) {
      // Envoi de la notification push
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(MESSAGE),
      });

      console.log("Notification push envoyée avec succès !");
    } else {
      console.log("Pas de token Expo, notification locale seulement.");
    }

    // Enregistrement de la notification dans Firestore
    await firestore().collection("notifications").add(DATA_TO_ADD);
  } catch (error) {
  }
}
