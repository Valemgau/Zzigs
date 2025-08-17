import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";

// Import des écrans
import Home from "../screens/Home";
import Login from "../screens/Auth/Login";
import PhoneVerificationPage from "../screens/Auth/PhoneVerificationPage";
import Profile from "../screens/Profile";
import { TouchableOpacity } from "react-native";
import ActivityDetails from "../screens/ActivityDetails";
import PasswordPage from "../screens/Auth/PasswordPage";
import { COLORS } from "../styles/colors";
import Categories from "../screens/Categories";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ReportReasonScreen from "../screens/ReportReasonScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
    screenOptions={{
      headerBackTitle: 'Retour', 
      headerTintColor: 'black',
    }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />

      <Stack.Screen
        name="Categories"
        component={Categories}
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
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
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
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle: 'Retour', 
        headerTintColor: 'black',
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false,
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />

      <Stack.Screen
        name="PhoneVerificationPage"
        component={PhoneVerificationPage}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="PasswordPage"
        component={PasswordPage}
        options={{
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />
    </Stack.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Rechercher") {
            iconName = "search-outline";
          } else if (route.name === "Compte") {
            iconName = "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#7f8c8d",
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={() => {
              props.onPress?.();
            }}
          />
        ),
        tabBarLabelStyle: {
          fontFamily: "Inter_400Regular",
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="Rechercher"
        component={HomeStack}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Compte"
        component={ProfileStack}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default AuthNavigator;
