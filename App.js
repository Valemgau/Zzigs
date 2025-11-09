import "./i18n.ts";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config/firebase";
import FlashMessage from "react-native-flash-message";
import Navigator from "./src/navigation/Navigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { STRIPE_PUBLIC_KEY } from "@env";
import { useFonts } from "expo-font";
import { StripeProvider } from "@stripe/stripe-react-native";
import moment from "moment";
import * as SplashScreen from "expo-splash-screen";
import {
  DMSans_400Regular,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import "moment/locale/fr";
import NetInfo from "@react-native-community/netinfo";
import ConnectionError from "./src/components/ConnectionError";

moment.locale("fr");

LocaleConfig.locales["fr"] = {
  monthNames: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  monthNamesShort: [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ],
  dayNames: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ],
  dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  today: "aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_600SemiBold,
    DMSans_700Bold,
    OpenSans_400Regular: DMSans_400Regular,
    OpenSans_600SemiBold: DMSans_600SemiBold,
    OpenSans_700Bold: DMSans_700Bold,
  });

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  // Vérifier la connexion Internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected =
        state.isConnected && state.isInternetReachable !== false;

      // Si on était déconnecté et maintenant on est connecté, recharger
      if (wasDisconnected && connected) {
        console.log("Connexion rétablie, rechargement...");
        setWasDisconnected(false);
        // Recharger les données utilisateur
        checkUserData();
      }

      // Si on se déconnecte
      if (!connected && isConnected) {
        setWasDisconnected(true);
      }

      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, [isConnected, wasDisconnected]);

  const checkUserData = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const isClient = userDoc.exists()
          ? userDoc.data().isClient || false
          : false;
        setUserData({ isClient });
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setUserData({ isClient: false });
      }
    } else {
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (host) => {
      if (host) {
        await checkUserData();
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 2000); // 2 secondes
    }
  }, [fontsLoaded, loading]);

  // Fonction de retry manuelle
  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    const connected = state.isConnected && state.isInternetReachable !== false;

    if (connected) {
      setIsConnected(true);
      setWasDisconnected(false);
      // Recharger les données
      if (auth.currentUser) {
        await checkUserData();
      }
    }
  };

  if (!fontsLoaded || loading) return null;

  // Afficher l'écran d'erreur si pas de connexion
  if (!isConnected) {
    return <ConnectionError onRetry={handleRetry} />;
  }

  return (
    <StripeProvider
      publishableKey={`${STRIPE_PUBLIC_KEY}`}
      merchantIdentifier="merchant.com.zzigs"
      urlScheme="zzigs"
      threeDSecureParams={{
        timeout: 5,
        redirectURL: "zzigs://stripe-redirect",
      }}
      debug={true}
    >
      <NavigationContainer>
        {userData ? <Navigator userData={userData} /> : <AuthNavigator />}
        <FlashMessage duration={5000} position="top" />
      </NavigationContainer>
    </StripeProvider>
  );
}
