// import "./global.css";
import "./i18n.ts";
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config/firebase";
import FlashMessage from "react-native-flash-message";
import Navigator from "./src/navigation/Navigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import ThemeProvider from "./src/ThemeProvider";
import { Calendar, LocaleConfig } from "react-native-calendars";
import {
  REVENUE_CAT_PUBLIC_KEY_IOS,
  REVENUE_CAT_PUBLIC_KEY_ANDROID,
  STRIPE_PUBLIC_KEY,
} from "@env";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (host) => {
      if (host) {
        try {
          const userDocRef = doc(db, "users", host.uid);
          const userDoc = await getDoc(userDocRef);
          const isClient = userDoc.exists()
            ? userDoc.data().isClient || false
            : false;
          setUserData({ isClient });
        } catch {
          setUserData({ isClient: false });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  if (!fontsLoaded || loading) return null;

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
        <FlashMessage position="top" />
      </NavigationContainer>
    </StripeProvider>
  );
}
