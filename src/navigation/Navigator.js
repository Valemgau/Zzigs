import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
// Import des écrans
import Home from "../screens/Home";
import Profile from "../screens/Profile";
import EditProfile from "../screens/EditProfile";
import AddInterest from "../screens/AddInterest";
import ActivityDetails from "../screens/ActivityDetails";
import Partners from "../screens/Partners";
import AddLocation from "../screens/AddLocation";
import Events from "../screens/Events";
import Conversations from "../screens/Conversations";
import Chat from "../screens/Chat";
import AddPhoneNumberPage from "../screens/AddPhoneNumberPage";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../styles/colors";
import MainStepIndicator from "../screens/AddEvent/MainStepIndicator";
import Categories from "../screens/Categories";
import MyEvents from "../screens/MyEvents";
import WriteReview from "../screens/WriteReview";
import EditEvent from "../screens/EditEvent";
import HowItsWork from "../screens/HowItsWork";
import MyCard from "../screens/MyCard";
import History from "../screens/History";
import ReferralPage from "../screens/ReferralPage";
import Friends from "../screens/Friends";
import ChatWithFriend from "../screens/ChatWithFriend";
import Participants from "../screens/Participants";
import AllOffers from "../screens/AllOffers";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";
import CoinsPage from "../screens/CoinsPage";
import Notifications from "../screens/Notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Statistiques from "../screens/Statistiques";
import Step6 from "../screens/AddEvent/Step6";
import DefisScreen from "../screens/DefisScreen";
import { useColorScheme } from "nativewind";
import LegalPage from "../screens/LegalPage";
import ClufPage from "../screens/ClufPage";
import ReportReasonScreen from "../screens/ReportReasonScreen";
import { getScreenOptions } from "./screenOptions";

// Déclarez les navigateurs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  const navigation = useNavigation();

  const getUserData = async () => {
    if (!auth().currentUser) return;
    try {
      const uid = auth().currentUser.uid;
      const userDoc = await firestore().collection("users").doc(uid).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données utilisateur :",
        error
      );
      return null;
    }
  };

  const checkAndRedirectProfile = async () => {
    setTimeout(async () => {
      const response = await getUserData();
      const user = auth().currentUser;

      if (user && !response?.loginWithApple && !response?.biography) {
        navigation.navigate("Profil", {
          screen: "EditProfile",
          params: { newProfile: true },
        });
      } else {
      }
    }, 2000);
  };

  useEffect(() => {
    checkAndRedirectProfile();
  }, []);

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  return (
    <Stack.Navigator screenOptions={getScreenOptions({ isDarkMode })}>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: "",
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="ClufPage"
        component={ClufPage}
        options={{
          presentation: "modal",
          title: "Conditions d'utilisation",
          title: "",
        }}
      />

      <Stack.Screen
        name="DefisScreen"
        component={DefisScreen}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="MyEvents"
        component={MyEvents}
        options={{
          title: "Mes évènements",
        }}
      />
      <Stack.Screen
        name="Friends"
        component={Friends}
        options={{
          title: "",
          headerTitle: "Mes partenaires",
        }}
      />

      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="AllOffers"
        component={AllOffers}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="Categories"
        component={Categories}
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="ReportReasonScreen"
        component={ReportReasonScreen}
        options={{
          title: "",
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="ActivityDetails"
        component={ActivityDetails}
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="Step6"
        component={Step6}
        options={{
          presentation: "modal",
          title: "Paiement",
        }}
      />

      <Stack.Screen
        name="Participants"
        component={Participants}
        options={{
          title: "",
          headerTitle: "Participants",
        }}
      />
      <Stack.Screen
        name="Conversations"
        component={Conversations}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={{
          title: "Messages",
        }}
      />
    </Stack.Navigator>
  );
};

const PartenerStack = () => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  return (
    <Stack.Navigator screenOptions={getScreenOptions({ isDarkMode })}>
      <Stack.Screen
        name="Friends"
        component={Friends}
        options={{
          title: "",
          headerTitle: "Mes partenaires",
        }}
      />

      <Stack.Screen
        name="Partners"
        component={Partners}
        options={{
          title: "",
          // headerTitle: "Trouver des partenaires",
        }}
      />

      <Stack.Screen
        name="ChatWithFriend"
        component={ChatWithFriend}
        options={{
          title: "",
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
};

// Créez un stack pour Profile (si besoin de navigation spécifique)
const ProfileStack = () => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={getScreenOptions({ isDarkMode })}
    >
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title: "Mon profil",
        }}
      />

      <Stack.Screen
        name="AllOffers"
        component={AllOffers}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="MyEvents"
        component={MyEvents}
        options={{
          title: "Mes évènements",
        }}
      />

      <Stack.Screen
        name="CoinsPage"
        component={CoinsPage}
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="WriteReview"
        component={WriteReview}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="HowItsWork"
        component={HowItsWork}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="MyCard"
        component={MyCard}
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="History"
        component={History}
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="EditEvent"
        component={EditEvent}
        options={{
          title: "Modifier",
        }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        initialParams={{ newProfile: false }}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="AddInterest"
        component={AddInterest}
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="AddLocation"
        component={AddLocation}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="AddPhoneNumberPage"
        component={AddPhoneNumberPage}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="ReferralPage"
        component={ReferralPage}
        options={{
          title: "",
        }}
      />
      <Stack.Screen
        name="LegalPage"
        component={LegalPage}
        options={{
          title: "",
        }}
      />
    </Stack.Navigator>
  );
};

// Navigateur principal avec les tabs
// Map pour associer les noms de route aux icônes
const screenIconMapping = {
  Activités: "search-outline",
  Partenaires: "people-outline",
  MainStepIndicator: "add-outline", // Utilisé comme fallback, mais surchargé
  Événements: "calendar-outline",
  Profil: "person-outline",
  Statistiques: "stats-chart-outline",
};

// Options communes pour les écrans texte (peut être étendu)
const commonHeaderOptions = {
  headerTitleStyle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
};

const Navigator = ({ sub }) => {
  const userSub = sub; // Utilisation directe de la prop

  // Si pas de niveau d'abonnement, ne rien rendre (ou un écran de chargement/erreur)
  if (!userSub) {
    return null;
  }

  // Détermine la couleur inactive en fonction du thème (si nécessaire ailleurs)
  // const { colorScheme } = useColorScheme(); // Plus nécessaire pour le background, mais peut l'être pour la couleur inactive
  // const isDarkMode = colorScheme === 'dark';
  // const inactiveTintColor = isDarkMode ? COLORS.inactiveDark : COLORS.inactiveLight;

  // Pour simplifier selon la demande, utilisons une valeur fixe pour l'instant
  const inactiveTintColor = COLORS.inactiveLight;
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Cacher les headers par défaut, surcharger si besoin
        tabBarIcon: ({ color, size }) => {
          const iconName =
            screenIconMapping[route.name] || "help-circle-outline"; // Fallback icon
          // L'icône 'MainStepIndicator' est gérée spécifiquement dans ses options
          if (route.name === "MainStepIndicator") return null; // Géré via options de l'écran
          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarShowLabel: false, // Manière standard de cacher les labels
        tabBarStyle: {
          backgroundColor: isDarkMode ? COLORS.bgDark : "white", // Couleur de fond de la tabbar
          // Autres styles de la tabbar si nécessaire (borderTopWidth: 0, etc.)
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_400Regular",
          fontSize: 12,
        },
        // Le tabBarButton global peut souvent être omis si on n'ajoute pas de logique complexe
        // Si seul activeOpacity est souhaité, il peut être géré autrement ou est souvent OK par défaut
        // tabBarButton: (props) => <TouchableOpacity activeOpacity={0.7} {...props} />,
      })}
    >
      {/* Écran Activités (toujours visible) */}
      <Tab.Screen
        name="Activités"
        component={HomeStack}
        options={{
          title: "Rechercher", // Utilisé si le header était montré ou pour l'accessibilité
        }}
      />

      {/* Écran Partenaires (visible sauf pour 'pro') */}
      {userSub !== "pro" && (
        <Tab.Screen
          name="Partenaires"
          component={PartenerStack}
          options={{
            title: "Mes partenaires",
          }}
        />
      )}

      {/* Écran Créer (visible pour 'premium' et 'pro') */}
      {(userSub === "premium" || userSub === "pro") && (
        <Tab.Screen
          name="MainStepIndicator"
          component={MainStepIndicator}
          initialParams={{ userSUB: userSub }} // Passer les props initiales si nécessaire
          options={{
            title: "Créer",
            // Header spécifique si besoin (mais caché par défaut globalement)
            headerShown: true,
            headerStyle: {
              backgroundColor: isDarkMode ? COLORS.bgDark : "white",
            },
            headerTintColor: isDarkMode ? "white" : "black",
            headerTitleStyle: commonHeaderOptions.headerTitleStyle,
            tabBarIcon: (
              { color } // Icône personnalisée avec fond
            ) => (
              <View style={styles.addButtonContainer}>
                <Ionicons name="add-outline" size={25} color={COLORS.white} />
              </View>
            ),
            tabBarButton: (
              props // Bouton personnalisé pour Haptics
            ) => (
              <TouchableOpacity
                activeOpacity={0.7}
                {...props}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  props.onPress?.(); // Déclenche la navigation par défaut
                }}
              />
            ),
          }}
        />
      )}

      {/* Écran Statistiques (visible seulement pour 'pro') */}
      {userSub === "pro" && (
        <Tab.Screen
          name="Statistiques"
          component={Statistiques}
          options={{
            title: "Statistiques",
          }}
        />
      )}

      {/* Écran Événements (visible sauf pour 'pro') */}
      {userSub !== "pro" && (
        <Tab.Screen
          name="Événements"
          component={Events}
          options={{
            title: "Mon agenda",
            headerShown: true, // Exemple: Montrer le header pour cet écran
            ...commonHeaderOptions,
          }}
        />
      )}

      {/* Écran Profil (toujours visible) */}
      <Tab.Screen
        name="Profil"
        component={ProfileStack}
        options={{
          title: "Compte",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 45, // Légèrement plus grand pour un meilleur aspect visuel
    height: 45,
    backgroundColor: COLORS.primary, // Utiliser la couleur primaire définie
    borderRadius: 25, // Rendre parfaitement rond
    justifyContent: "center",
    alignItems: "center",
    bottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Navigator;
