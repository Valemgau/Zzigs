import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import moment from "moment";
import { db } from "../../config/firebase"; // ton export firebase/firestore modulaire

export default async function sendNotifs(user, message) {
  const MESSAGE = {
    to: user.expoPushToken,
    sound: "default",
    title: `${message.title}`,
    body: `${message.desc}`,
  };

  const DATA_TO_ADD = {
    title: `${message.title}`,
    text: `${message.desc}`,
    userId: `${user.id}`,
    isNew: true,
    type:
      !message.type || message.type === null || message.type === ""
        ? null
        : message.type,
    createdAt: moment().format(),
  };

  try {
    if (user.expoPushToken) {
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

    await addDoc(collection(db, "notifications"), DATA_TO_ADD);
  } catch (error) {
    console.error("Erreur sendNotifs :", error);
  }
}
