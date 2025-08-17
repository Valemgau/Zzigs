import "./global.css";
import React, { useState, useEffect, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogBox, Platform, Text, Linking } from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import NetInfo from "@react-native-community/netinfo";
import Navigator from "./src/navigation/Navigator";
import ConnectionError from "./src/components/ConnectionError";
import AuthNavigator from "./src/navigation/AuthNavigator";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import FlashMessage from "react-native-flash-message";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { ThemeProvider } from "./src/ThemeProvider";
import { useColorScheme } from "nativewind";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Calendar, LocaleConfig } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  REVENUE_CAT_PUBLIC_KEY_IOS,
  REVENUE_CAT_PUBLIC_KEY_ANDROID,
  STRIPE_PUBLIC_KEY,
} from "@env";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as SplashScreen from "expo-splash-screen";
import { Entypo } from "@expo/vector-icons";
import * as Font from "expo-font";

SplashScreen.preventAutoHideAsync();
// Purchases.setLogLevel(LOG_LEVEL.NONE);
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

export default function App() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [sub, setSub] = useState(null);
  const [connected, setConnected] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  const handleDeepLink = useCallback(({ url }) => {
    if (url?.includes("stripe")) {
      const { handleURLCallback } = require("@stripe/stripe-react-native");
      handleURLCallback(url);
    }
  }, []);

  useEffect(() => {
    LogBox.ignoreAllLogs();
    const listener = Linking.addEventListener("url", handleDeepLink);
    return () => listener.remove();
  }, []);

  const fetchSubscriptionState = async () => {
    try {
      const purchaserInfo = await Purchases.getCustomerInfo();
      const entitlements = purchaserInfo.entitlements.active;
      let subType = "gratuit";
      if (entitlements.pro) subType = "pro";
      else if (entitlements.premium) subType = "premium";
      setSub(subType);
      await AsyncStorage.setItem("sub", subType);
    } catch (error) {
      console.error("Erreur état abonnement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Purchases.configure({
      apiKey:
        Platform.OS === "ios"
          ? REVENUE_CAT_PUBLIC_KEY_IOS
          : REVENUE_CAT_PUBLIC_KEY_ANDROID,
      appUserID: null,
    });

    fetchSubscriptionState();

    const unsubscribeAuth = auth().onAuthStateChanged(async (user) => {
      setAuthenticated(!!user);
      setLoading(false);
      if (user) {
        await Purchases.logIn(user.uid);
        fetchSubscriptionState();
        try {
          const userRef = firestore().collection("users").doc(user.uid);
          const docSnapshot = await userRef.get();
          await (docSnapshot.exists
            ? userRef.update({ lastLogin: moment().format() })
            : userRef.set({ lastLogin: moment().format() }));
        } catch (error) {
          console.error("Erreur lastLogin:", error);
        }
      } else {
        await Purchases.logOut();
      }
    });

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNetInfo();
    };
  }, [sub]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Entypo.font);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady || loading || !fontsLoaded || !STRIPE_PUBLIC_KEY || !sub) {
    return null;
  }

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Inter_500Medium" };

  return (
    <StripeProvider
      publishableKey={`${STRIPE_PUBLIC_KEY}`}
      merchantIdentifier="merchant.com.connectmove"
      urlScheme="connectmove"
      threeDSecureParams={{
        timeout: 5,
        redirectURL: "connectmove://stripe-redirect",
      }}
      debug={true}
    >
      <ThemeProvider>
        <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
          <GestureHandlerRootView
            style={{ flex: 1 }}
            onLayout={onLayoutRootView}
          >
            {!connected ? (
              <ConnectionError />
            ) : authenticated ? (
              <Navigator sub={sub} />
            ) : (
              <AuthNavigator />
            )}
            <FlashMessage position="top" />
          </GestureHandlerRootView>
        </NavigationContainer>
      </ThemeProvider>
    </StripeProvider>
  );
}
