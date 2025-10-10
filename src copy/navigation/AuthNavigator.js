import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SignInScreen from "../screens/Auth/SignInScreen";
import PhoneVerificationPage from "../screens/Auth/PhoneVerificationPage";
import PasswordPage from "../screens/Auth/PasswordPage";
import ForgotPassword from "../screens/ForgotPassword";
import Register from "../screens/Auth/Register";
import { getScreenOptions } from "./screenOptions";
import HomeScreen from "../screens/HomeScreen";
import ReportProjectScreen from "../screens/ReportProjectScreen";
import ProjectDetailsScreen from "../screens/ProjectDetailsScreen";
import ResetPassword from "../screens/ResetPassword";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={getScreenOptions()}>
      {/* <Stack.Navigator screenOptions={{ headerShown: false }}> */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{
          title: "",
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            color: "#fff",
          },
        }}
      />

      <Stack.Screen
        name="PhoneVerificationPage"
        component={PhoneVerificationPage}
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
        name="PasswordPage"
        component={PasswordPage}
        options={{ title: "Espace connexion" }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ title: "Espace inscription" }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{ title: "" }}
      />
      {/* Ajoute Register si besoin */}
    </Stack.Navigator>
  );
}
