import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import TailorHomeScreen from "./TailorHomeScreen";
import Calendar from "./Calendar";
import Loader from "../components/Loader";
import SettingsScreen from "./SettingsScreen";
import MyProjects from "./MyProjects";

export default function HomeScreen() {
  const [isClient, setIsClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!auth.currentUser) {
        setIsClient(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const data = userDoc.exists() ? userDoc.data() : null;
        setIsClient(data?.isClient === true);
      } catch (error) {
        console.error("Erreur récupération rôle utilisateur:", error);
        setIsClient(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return <Loader />;
  }

  // Si client, afficher Calendar
  // Si couturier, afficher TailorHomeScreen (anciennement HomeScreen)
  return isClient ? <MyProjects /> : <TailorHomeScreen />;
  // return isClient ? <SettingsScreen /> : <TailorHomeScreen />;
}