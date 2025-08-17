import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  View,
  Text,
  Image,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  Pressable,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import moment from "moment";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Slider } from "@rneui/base";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { useFocusEffect } from "@react-navigation/native";
import "moment/locale/fr";
import FastImage from "react-native-fast-image";
import i18n from "../../i18n";
moment.locale("fr");

const Friends = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [salons, setSalons] = useState([]);
  const [salonID, setSalonID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        friends.length && (
          <TouchableOpacity
            onPress={() =>
              showMessage({
                message:
                  "Glissez de droite à gauche pour afficher plus d'options",
                type: "info",
              })
            }
            className="flex items-center justify-center rounded-full  mr-2"
          >
            <Ionicons
              name="information-circle-outline"
              size={30}
              color="#2563EB"
            />
          </TouchableOpacity>
        ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Partners")}
          className="flex items-center justify-center rounded-full  mr-2"
        >
          <Ionicons name="add-outline" size={30} color="#2563EB" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const fetchFriendsFromSalons = async () => {
        try {
          const currentUser = auth().currentUser;
          if (currentUser) {
            const userId = currentUser.uid;

            // Récupérer tous les salons où l'utilisateur est un participant
            const salonsSnapshot = await firestore()
              .collection("salons")
              .where("participants", "array-contains", userId)
              .get();
            let friendIds = [];
            let salonsData = [];

            // Extraire les IDs des autres participants
            salonsSnapshot.docs.forEach((doc) => {
              setSalonID(doc.id);
              const participants = doc.data().participants;
              friendIds.push(...participants.filter((id) => id !== userId));
              salonsData.push({ id: doc.id, ...doc.data() });
            });

            // Supprimer les doublons
            friendIds = [...new Set(friendIds)];

            // Récupérer les données des amis
            const friendsPromises = friendIds.map((friendId) =>
              firestore().collection("users").doc(friendId).get()
            );

            const friendsDocs = await Promise.all(friendsPromises);

            // Filtrer et formater les données des amis
            const friendsData = friendsDocs
              .filter((doc) => doc.exists)
              .map((doc) => ({ id: doc.id, ...doc.data() }));

            setFriends(friendsData);
            setSalons(salonsData);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des amis :", error);
        } finally {
          setLoading(false);
        }
      };

      fetchFriendsFromSalons();
    }, [])
  );

  const deleteSalonAndMessages = async (friendId) => {
    // Afficher une alerte de confirmation
    Alert.alert(
      "confirmation",
      "supprimer le partenaire et tous vos messages ?",
      [
        {
          text: "Annuler",
          onPress: () => console.log("Suppression annulée"),
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const currentUserId = auth().currentUser.uid;

              // Trouver les salons où vous et le friendId êtes participants
              const relatedSalons = salons.filter(
                (salon) =>
                  salon.participants.includes(currentUserId) &&
                  salon.participants.includes(friendId)
              );

              for (const salon of relatedSalons) {
                const salonId = salon.id;

                // Supprimer tous les messages associés au salon
                const messagesSnapshot = await firestore()
                  .collection("friendsMessages")
                  .where("salonId", "==", salonId)
                  .get();

                const batch = firestore().batch();
                messagesSnapshot.docs.forEach((doc) => {
                  batch.delete(doc.ref); // Ajouter chaque message au batch pour suppression
                });
                await batch.commit(); // Exécuter la suppression en batch

                // Supprimer le salon
                await firestore().collection("salons").doc(salonId).delete();

                // Mettre à jour l'état local pour refléter la suppression
                setSalons((prevSalons) =>
                  prevSalons.filter((salon) => salon.id !== salonId)
                );
              }
              showMessage({
                message: "partenaire supprimé",
                type: "info",
              });
              // Mettre à jour la liste des amis localement
              setFriends((prevFriends) =>
                prevFriends.filter((friend) => friend.id !== friendId)
              );
            } catch (error) {
              console.error(
                "Erreur lors de la suppression des salons et des messages associés :",
                error
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const toggleModal = () => {
    setShowFilterModal(!showFilterModal);
  };

  const getCommonInterests = (currentUserInterests, otherUserInterests) => {
    return currentUserInterests.filter((interest) =>
      otherUserInterests.includes(interest)
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="text-gray-500 text-lg"
        >{i18n.t("aucun_partenaire_disponible_pour_le_moment")}</Text>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(100)}
      className="flex-1 bg-gray-100 dark:bg-gray-900"
    >
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                className=""
                onPress={() => deleteSalonAndMessages(item.id)}
                style={{
                  backgroundColor: "red",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 80,
                  height: "90%",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>{i18n.t("supprimer")}</Text>
              </Pressable>
            )}
          >
            <Pressable
              onPress={() =>
                salonID &&
                navigation.navigate("ChatWithFriend", {
                  salonId: salonID,
                  friend: item,
                })
              }
              className="flex-row items-center p-6 bg-white dark:bg-gray-800 mb-2 rounded-lg"
            >
              <Animated.View entering={FadeIn.duration(200)}>
                <FastImage
                  style={{ width: 50, height: 50, borderRadius: 50 / 2, marginRight:10 }}
                  source={{
                    uri: item.photoURL,
                    priority: FastImage.priority.high,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </Animated.View>
              <View>
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-base font-bold text-gray-900 dark:text-white"
                >
                  {item.username}
                </Text>
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Intérêts communs :{" "}
                  {item.interests?.slice(0, 1).join(", ") || "Aucun"}
                </Text>
                {/* Dernière connexion (lastLogin) */}
                {item.lastLogin && (
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="text-sm text-gray-400 dark:text-gray-400"
                  >
                    Dernière fois en ligne :{" "}
                    {item.lastLogin
                      ? moment(item.lastLogin).fromNow() // Affiche "il y a X temps"
                      : "Inconnu"}
                  </Text>
                )}
              </View>
            </Pressable>
          </Swipeable>
        )}
      />
    </Animated.View>
  );
};

export default Friends;
