import React, { useCallback, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import moment from "moment";
import "moment/locale/fr";
import { COLORS } from "../styles/colors";
import Loader from "../components/Loader";
import HeaderProjects from "../components/HeaderProjects";
import { showMessage } from "react-native-flash-message";
import { Swipeable } from "react-native-gesture-handler";

moment.locale("fr");

const ITEMS_PER_PAGE = 20;

export default function MyProjects() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid;

  const [projects, setProjects] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userFirstname, setUserFirstname] = useState("");

  // Masquer le header de navigation
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserFirstname(userData.firstname || "");
      }
    } catch (error) {
      console.error("Erreur chargement données utilisateur:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsRef = collection(db, "projects");
      const q = query(
        projectsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const projectsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProjects(projectsList);
      setDisplayedProjects(projectsList.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
    } catch (error) {
      console.error("Erreur chargement projets:", error);
      showMessage({
        message: "Erreur",
        description: "Impossible de charger les projets",
        type: "danger",
        icon: "danger",
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchUserData(), fetchProjects()]);
        setLoading(false);
      };

      loadData();
    }, [userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchProjects()]);
    setRefreshing(false);
  };

  const loadMoreProjects = () => {
    if (loadingMore || displayedProjects.length >= projects.length) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const newProjects = projects.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedProjects(newProjects);
      setCurrentPage(nextPage);
      setLoadingMore(false);
    }, 300);
  };

  const handleDeleteProject = (projectId, projectTitle) => {
    Alert.alert(
      "Supprimer le projet",
      `Êtes-vous sûr de vouloir supprimer le projet "${projectTitle}" ?\n\nCette action est irréversible.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "projects", projectId));

              // Mettre à jour l'état local
              const updatedProjects = projects.filter(
                (p) => p.id !== projectId
              );
              setProjects(updatedProjects);
              setDisplayedProjects(
                updatedProjects.slice(0, currentPage * ITEMS_PER_PAGE)
              );

              showMessage({
                message: "Projet supprimé",
                description: "Le projet a été supprimé avec succès",
                type: "success",
                icon: "success",
              });
            } catch (error) {
              console.error("Erreur suppression projet:", error);
              showMessage({
                message: "Erreur",
                description: "Impossible de supprimer le projet",
                type: "danger",
                icon: "danger",
              });
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        text: "En attente",
        color: "#F59E0B",
        icon: "hourglass-empty",
      },
      active: {
        text: "Actif",
        color: "#10B981",
        icon: "check-circle",
      },
      completed: {
        text: "Terminé",
        color: "#6366F1",
        icon: "done-all",
      },
      cancelled: {
        text: "Annulé",
        color: "#EF4444",
        icon: "cancel",
      },
    };
    return (
      badges[status] || {
        text: "En attente",
        color: "#F59E0B",
        icon: "hourglass-empty",
      }
    );
  };

  const renderRightActions = (projectId, projectTitle) => {
    return (
      <View className="flex-row items-center h-full">
        <Pressable
          onPress={() =>
            navigation.navigate("EditProject", { projectId: projectId })
          }
          className="bg-blue-500 justify-center items-center h-full px-5 ml-2"
          style={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <MaterialIcons name="edit" size={24} color="#fff" />
        </Pressable>
        <Pressable
          onPress={() => handleDeleteProject(projectId, projectTitle)}
          className="bg-red-500 justify-center items-center h-full px-5"
        >
          <MaterialIcons name="delete" size={24} color="#fff" />
        </Pressable>
      </View>
    );
  };

  const renderProject = ({ item, index }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <Animated.View
        entering={FadeInDown.duration(300).delay(index * 30)}
        className="mx-4 mb-2"
      >
        <Swipeable
          renderRightActions={() =>
            renderRightActions(item.id, item.project || item.type)
          }
          overshootRight={false}
          friction={2}
          rightThreshold={40}
        >
          <Pressable
            onPress={() =>
              navigation.navigate("EditProject", { projectId: item.id })
            }
            className="bg-white rounded-xl overflow-hidden"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <View className="p-4 flex-row items-center">
              {/* Icône */}
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${COLORS.primary}15` }}
              >
                <MaterialIcons
                  name="content-cut"
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              {/* Contenu principal */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    style={{ fontFamily: "OpenSans_700Bold" }}
                    className="text-base text-gray-900 flex-1"
                    numberOfLines={1}
                  >
                    {item.type || "Projet"}
                  </Text>
                  <View
                    className="px-2 py-1 rounded-md ml-2"
                    style={{ backgroundColor: `${statusBadge.color}20` }}
                  >
                    <Text
                      style={{
                        fontFamily: "OpenSans_600SemiBold",
                        color: statusBadge.color,
                      }}
                      className="text-xs"
                    >
                      {statusBadge.text}
                    </Text>
                  </View>
                </View>

                {/* Description courte */}
                {item.project && (
                  <Text
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    className="text-gray-600 text-sm mb-1"
                    numberOfLines={1}
                  >
                    {item.project}
                  </Text>
                )}

                {/* Infos en ligne */}
                <View className="flex-row items-center flex-wrap">
                  {item.city && (
                    <View className="flex-row items-center mr-3">
                      <MaterialIcons name="place" size={14} color="#9CA3AF" />
                      <Text
                        style={{ fontFamily: "OpenSans_400Regular" }}
                        className="text-gray-500 text-xs ml-1"
                      >
                        {item.city}
                      </Text>
                    </View>
                  )}
                  {item.budget && (
                    <View className="flex-row items-center mr-3">
                      <MaterialIcons name="euro" size={14} color="#9CA3AF" />
                      <Text
                        style={{ fontFamily: "OpenSans_400Regular" }}
                        className="text-gray-500 text-xs ml-1"
                      >
                        {item.budget}€
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    className="text-gray-400 text-xs"
                  >
                    {moment(item.createdAt?.toDate()).format("DD/MM/YYYY")}
                  </Text>
                </View>
              </View>

              {/* Chevron */}
              <MaterialIcons
                name="chevron-right"
                size={20}
                color="#D1D5DB"
                style={{ marginLeft: 8 }}
              />
            </View>
          </Pressable>
        </Swipeable>
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View className="flex-1 justify-center items-center px-6 py-20">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${COLORS.primary}15` }}
        >
          <MaterialIcons name="work-outline" size={48} color={COLORS.primary} />
        </View>
        <Text
          style={{ fontFamily: "OpenSans_700Bold", color: COLORS.primary }}
          className="text-xl text-center mb-2"
        >
          Aucun projet
        </Text>
        <Text
          style={{ fontFamily: "OpenSans_400Regular" }}
          className="text-gray-500 text-sm text-center mb-6"
        >
          Vous n'avez pas encore créé de projet.{"\n"}
          Commencez par créer votre premier projet !
        </Text>
        <Pressable
          onPress={() => navigation.navigate("AddProject")}
          className="px-6 py-3 rounded-full flex-row items-center"
          style={{ backgroundColor: COLORS.primary }}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text
            style={{ fontFamily: "OpenSans_600SemiBold" }}
            className="text-white ml-2"
          >
            Créer un projet
          </Text>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (!userId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text
            style={{ fontFamily: "OpenSans_700Bold" }}
            className="text-gray-700 text-lg text-center mt-4"
          >
            Vous devez être connecté pour voir vos projets
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header Component */}
      <HeaderProjects
        welcomeMessage={userFirstname ? `${t("welcome")} ${userFirstname}` : null}
        title="Mes Projets"
        subtitle={`${projects.length} ${
          projects.length > 1 ? "projets" : "projet"
        }`}
        rightButton={{
          icon: "add",
          label: "Nouveau",
          onPress: () => navigation.navigate("AddProject"),
        }}
        leftButton={{
          icon: "refresh",
          onPress: onRefresh,
          loading: refreshing,
        }}
      />

      {/* Liste des projets */}
      <FlatList
        data={displayedProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        onEndReached={loadMoreProjects}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
