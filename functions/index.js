const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);
const nodemailer = require("nodemailer");
admin.initializeApp();
const transporter = nodemailer.createTransport({
  host: functions.config().smtp.host,
  port: functions.config().smtp.port,
  secure: functions.config().smtp.port == "465", // true si 465
  auth: {
    user: functions.config().smtp.user,
    pass: functions.config().smtp.pass,
  },
});

// Fonction callable pour envoyer un email de bienvenue
exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentification requise."
    );
  }

  const { email, username } = data;

  if (!email || !username) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email et username sont requis."
    );
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:8px;">
      <h1 style="color:#ff6600;">Bienvenue ${username} 🎉</h1>
      <p>Nous sommes ravis de t’accueillir sur notre plateforme.</p>
      <p>Découvre dès maintenant les fonctionnalités et rejoins la communauté.</p>
      <a href="https://ton-site.com" 
         style="display:inline-block; padding:10px 20px; background:#ff6600; color:#fff; text-decoration:none; border-radius:5px; margin-top:20px;">
        Découvrir maintenant
      </a>
      <p style="margin-top:30px; font-size:12px; color:#888;">Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ton App" <${functions.config().smtp.user}>`,
      to: email,
      subject: "Bienvenue sur notre application 🎉",
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email bienvenue:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erreur lors de l’envoi de l’email."
    );
  }
});
Instructions: exports.createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    // Autoriser CORS
    res.set("Access-Control-Allow-Origin", "*");

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez être connecté pour effectuer cette action."
      );
    }

    const { amount, currency } = data;

    if (!amount || !currency) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Les paramètres amount et currency sont requis."
      );
    }

    if (amount <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le montant doit être supérieur à zéro."
      );
    }

    if (!["eur", "usd"].includes(currency)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Devise non prise en charge."
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: { userId: context.auth.uid },
      });

      await admin.firestore().collection("payments").doc(paymentIntent.id).set({
        userId: context.auth.uid,
        amount: amount,
        currency: currency,
        status: "created",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error("Erreur création Payment Intent:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la création du Payment Intent."
      );
    }
  }
);

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const webhookSecret = functions.config().stripe.webhook_secret;
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Échec vérification signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await admin
          .firestore()
          .collection("payments")
          .doc(paymentIntent.id)
          .update({
            status: "succeeded",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntentFailed = event.data.object;
        await admin
          .firestore()
          .collection("payments")
          .doc(paymentIntentFailed.id)
          .update({
            status: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Erreur traitement webhook:", error);
    return res.status(500).send("Erreur interne du serveur");
  }
});

exports.getStripePublicKey = functions.https.onRequest((req, res) => {
  const publicKey = functions.config().stripe.public_key;
  res.status(200).send({ publicKey });
});

exports.createApplePaymentIntent = functions.https.onRequest(
  async (req, res) => {
    // Autorise les requêtes cross-origin
    res.set("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      return res.status(204).send("");
    }
    try {
      // Création du client
      const customer = await stripe.customers.create();
      const customerId = customer.id;

      // Génération de la clé éphémère
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: "2023-08-16" }
      );

      // Création du Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "eur",
        customer: customerId,
        automatic_payment_methods: { enabled: true }, // Configuration unique
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret, // Clé générée
        customer: customerId,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
