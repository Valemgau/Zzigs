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
import PayScreen from "../screens/PayScreen";
import EditRole from "../screens/EditRole";
import VerifyEmail from "../screens/Auth/VerifyEmail";
import EditBankInfo from "../screens/EditBankInfo";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import ChatListScreen from "../screens/ChatList";
import ChatScreen from "../screens/ChatScreen";
import Calendar from "../screens/Calendar";
import SuccessPaymentScreen from "../screens/SuccessPaymentScreen";
import { t } from "i18next";
import EditProject from "../screens/EditProject";

const Stack = createStackNavigator();

export default function Navigator({ userData }) {
  const isClient = userData?.isClient;

  return (
    <Stack.Navigator screenOptions={getScreenOptions()}>
      {/* PAGE D'ACCUEIL UNIQUE POUR TOUS */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        // initialParams={{ isClient }}
        // options={{ title: t("welcome") }}
        options={{ title: "" }}
      />

      {/* Les deux */}
      <Stack.Screen name="BloqueCompte" component={BloqueCompte} />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmail}
        options={{ title: "" }}
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
        options={{ title: "" }}
      />
      <Stack.Screen
        name="EditLocation"
        component={EditLocation}
        options={{ title: "" }}
      />

      {/* Couturier uniquement */}
      {!isClient && (
        <Stack.Screen
          name="EditBankInfo"
          component={EditBankInfo}
          options={{ title: "" }}
        />
      )}

      {/* Les deux */}
      <Stack.Screen
        name="EditPhoneNumber"
        component={EditPhoneNumber}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="EditLanguage"
        component={EditLanguage}
        options={{ title: "" }}
      />
      <Stack.Screen
        initialParams={userData}
        name="ContactUs"
        component={ContactUs}
        options={{ title: "" }}
      />

      {/* Client uniquement */}
      {isClient && (
        <Stack.Screen
          name="AddProject"
          component={AddProject}
          options={{ title: "" }}
        />
      )}

       {isClient && (
        <Stack.Screen
          name="EditProject"
          component={EditProject}
          options={{ title: "" }}
        />
      )}

      {/* Les deux */}
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="DeleteAccountScreen"
        component={DeleteAccountScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="ProjectDetailsScreen"
        component={ProjectDetailsScreen}
        options={{ title: "" }}
      />

      {/* Couturier uniquement */}
      {!isClient && (
        <>
          <Stack.Screen
            name="ReportProjectScreen"
            component={ReportProjectScreen}
            options={{ title: "" }}
          />
          <Stack.Screen
            name="FaireOffreScreen"
            component={FaireOffreScreen}
            options={{ title: "" }}
          />
        </>
      )}

      {/* Client uniquement */}
      {isClient && (
        <>
          <Stack.Screen
            name="PayScreen"
            component={PayScreen}
            options={{ title: "" }}
          />
          <Stack.Screen
            name="SuccessPaymentScreen"
            component={SuccessPaymentScreen}
            options={{ title: "", headerShown: false }}
          />
        </>
      )}

      {/* Les deux */}
      <Stack.Screen
        name="ChatListScreen"
        component={ChatListScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Calendar"
        component={Calendar}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ title: "", headerShown: false }}
      />
    </Stack.Navigator>
  );
}
