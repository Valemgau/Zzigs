import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import BloqueCompte from "../screens/Auth/BloqueCompte";
import ConfirmEmail from "../screens/Auth/ConfirmEmail";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfile from "../screens/EditProfile";
import { getScreenOptions } from "./screenOptions";
import EditLocation from "../screens/EditLocation";
import ContactUs from "../screens/ContactUs";
import EditPhoneNumber from "../screens/EditPhoneNumber";
import EditLanguage from "../screens/EditLanguage";
import AddProject from "../screens/AddProject";
import ProjectDetailsScreen from "../screens/ProjectDetailsScreen";
import FaireOffreScreen from "../screens/FaireOffreScreen";
import ReportProjectScreen from "../screens/ReportProjectScreen";
import OffersListScreen from "../screens/OffersListScreen";
import ReceivedOffersScreen from "../screens/ReceivedOffersScreen";
import PayScreen from "../screens/PayScreen";
import EditRole from "../screens/EditRole";
import VerifyEmail from "../screens/Auth/VerifyEmail";
import EditBankInfo from "../screens/EditBankInfo";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";

const Stack = createStackNavigator();

export default function Navigator({ userData }) {
  return (
    <Stack.Navigator screenOptions={getScreenOptions()}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BloqueCompte" component={BloqueCompte} />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmail}
        options={{ title: "Valider l'adresse e-mail" }}
      />
      <Stack.Screen name="ConfirmEmail" component={ConfirmEmail} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="EditRole"
        component={EditRole}
        options={{ title: "Choisir un role" }}
      />
      <Stack.Screen
        name="EditLocation"
        component={EditLocation}
        options={{ title: "Modifier" }}
      />
      <Stack.Screen
        name="EditBankInfo"
        component={EditBankInfo}
        options={{ title: "Modifier" }}
      />
      <Stack.Screen
        name="EditPhoneNumber"
        component={EditPhoneNumber}
        options={{ title: "Modifier" }}
      />
      <Stack.Screen
        name="EditLanguage"
        component={EditLanguage}
        options={{ title: "Choisir la langue" }}
      />
      <Stack.Screen
        initialParams={userData}
        name="ContactUs"
        component={ContactUs}
        options={{ title: "Nous contacter" }}
      />
      <Stack.Screen
        name="AddProject"
        component={AddProject}
        options={{ title: "Ajouter un projet" }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: "Paramètres" }}
      />
      <Stack.Screen
        name="DeleteAccountScreen"
        component={DeleteAccountScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="ProjectDetailsScreen"
        component={ProjectDetailsScreen}
        options={{ title: "Détails" }}
      />
      <Stack.Screen
        name="ReportProjectScreen"
        component={ReportProjectScreen}
        options={{ title: "Signaler" }}
      />
      <Stack.Screen
        name="FaireOffreScreen"
        component={FaireOffreScreen}
        options={{ title: "" }}
      />

      <Stack.Screen
        name="OffersListScreen"
        component={OffersListScreen}
        options={{ title: "Offres envoyées" }}
      />
      <Stack.Screen
        name="ReceivedOffersScreen"
        component={ReceivedOffersScreen}
        options={{ title: "Offres reçues" }}
      />
      <Stack.Screen
        name="PayScreen"
        component={PayScreen}
        options={{ title: "Paiement" }}
      />
      {/* Ajoute d'autres écrans ici */}
    </Stack.Navigator>
  );
}
