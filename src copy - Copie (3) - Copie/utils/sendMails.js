import { SENDGRID_FROM, SENDGRID_API_KEY } from "@env";
import axios from "axios";
import sendNotifs from "./sendNotifs";
import { BASE_URL } from "@env";

function enleverEspaces(chaine) {
  return chaine.replace(/\s/g, "");
}

async function sendWelcomeEmail(email, username) {
    try {
      const response = await fetch(
        "https://connectetmove.com/api/send-welcome",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, username }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        console.log("Succès:", json.message || "Email envoyé");
      } else {
        console.error("Erreur serveur:", response.status);
      }
    } catch (error) {
      console.error("Erreur requête:", error);
    }
  }


export { sendWelcomeEmail };
