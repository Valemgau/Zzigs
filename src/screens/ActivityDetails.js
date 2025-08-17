import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  Alert,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
  TouchableOpacity,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import sendNotifs from "../utils/sendNotifs";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  SharedTransition,
  SlideInDown,
  SlideInUp,
} from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import ImageSlider from "../components/ImageSlider";
import { getDaysDifference, getFormattedDate } from "../utils/allFunctions";
import { COLORS } from "../styles/colors";
import MapView, { Circle, Polygon } from "react-native-maps";
import i18n from "../../i18n";

const ActivityDetails = ({ route, userinfo }) => {
  const navigation = useNavigation();
  const { activityId, image, distance, userPostalCode } = route.params;
  const [images, setImages] = useState(null);
  const [activity, setActivity] = useState(null);
  const [messages, setMessages] = useState(null);
  const [userId, setUserId] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    //
  }, [coordinates]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerTitle: "Détails",
      headerRight: () =>
        auth().currentUser && (
          <Pressable
            onPress={handleSaved}
            className="flex items-center justify-center rounded-full  mr-2"
          >
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-base text-blue-500 dark:text-gray-400"
            >
              {saved ? "Supprimer" : "Enregistrer"}
            </Text>
          </Pressable>
        ),
    });
  }, [navigation, activity, isUserParticipant, isActiveParticipant, saved]);

  useEffect(() => {
    if (!auth().currentUser) {
      return;
    }
    const fetchUserId = () => {
      const currentUser = auth().currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);
      }
      checkIfSaved();
    };
    fetchUserId();
  }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      fetchActivityDetails();
    }, [activityId])
  );

  const fetchActivityDetails = async () => {
    try {
      // Récupérer les détails de l'activité
      const activityDoc = await firestore()
        .collection("activities")
        .doc(activityId)
        .get();

      if (activityDoc.exists) {
        const activityData = activityDoc.data();
        setImages(activityData.images);

        // Initialiser un tableau vide si les participants n'existent pas
        if (!activityData.participants) {
          activityData.participants = [];
        }

        setActivity(activityData);
        setCoordinates({
          ...activityData.coordinates,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        // Vérifier s'il y a un participant en première position
        const adminParticipant = activityData.creatorId;

        if (adminParticipant) {
          // Récupérer les informations de l'utilisateur admin
          const adminDoc = await firestore()
            .collection("users")
            .doc(adminParticipant)
            .get();

          if (adminDoc.exists) {
            const adminData = { id: adminDoc.id, ...adminDoc.data() };
            setAdminUser(adminData);
          } else {
            console.log("Admin user not found.");
          }
        }

        // Récupérer la conversation associée à l'activité
        const conversationSnapshot = await firestore()
          .collection("conversations")
          .where("activityId", "==", activityId)
          .limit(1)
          .get();

        if (!conversationSnapshot.empty) {
          const conversationDoc = conversationSnapshot.docs[0];
          const conversationData = {
            id: conversationDoc.id,
            ...conversationDoc.data(),
          };

          // Récupérer les messages associés à la conversation
          const messagesSnapshot = await firestore()
            .collection("messages")
            .where("conversationId", "==", conversationDoc.id)
            .orderBy("createdAt", "desc")
            .get();

          const messages = messagesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setMessages(messages);
        } else {
          console.log("Aucune conversation trouvée pour cette activité.");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'activité :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinActivity = async () => {
    // try {
    //   // Ajouter l'utilisateur à la liste des participants avec `active: false`
    //   const newParticipant = {
    //     userId,
    //     active: false,
    //     here: false,
    //     joinedAt: moment().format(),
    //   };
    //   await firestore()
    //     .collection("activities")
    //     .doc(activityId)
    //     .update({
    //       participants: firestore.FieldValue.arrayUnion(newParticipant),
    //     });
    //   const messageToAdmin = {
    //     title: `${activity.title}`,
    //     desc: `Vous avez une nouvelle demande`,
    //     type: `join_demands`,
    //   };
    //   sendNotifs(adminUser, messageToAdmin);
    //   showMessage({
    //     message:
    //       "Nous vous tiendrons informé dès que l'admin aura validé votre demande.",
    //     type: "success",
    //   });
    //   fetchActivityDetails();
    // } catch (error) {
    //   console.error("Erreur lors de l'envoi de la demande :", error);
    //   showMessage({
    //     message: "Impossible d'envoyer votre demande. Veuillez réessayer.",
    //     type: "danger",
    //   });
    // }

    const messageToCreator = {
      title: `${activity.title}`,
      desc: `Vous avez une nouvelle demande`,
      type: `join_demands`,
    };

    navigation.navigate("Step6", {
      activityId,
      messageToCreator,
      adminUser,
      userinfo,
      activity,
      images,
    });
  };

  const handleLeaveActivity = async () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir quitter cette activité ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              // Trouver le participant correspondant à l'utilisateur actuel
              const participantToRemove = activity.participants.find(
                (participant) => participant.userId === userId
              );

              if (!participantToRemove) {
                showMessage({
                  message: "Vous n'êtes pas participant à cette activité.",
                  type: "danger",
                });
                return;
              }

              // Supprimer le participant
              await firestore()
                .collection("activities")
                .doc(activityId)
                .update({
                  participants:
                    firestore.FieldValue.arrayRemove(participantToRemove),
                });

              showMessage({
                message: "Vous avez quitté l'activité.",
                type: "info",
              });

              fetchActivityDetails();
            } catch (error) {
              console.error("Erreur lors de la sortie de l'activité :", error);

              showMessage({
                message:
                  "Impossible de quitter l'activité. Veuillez réessayer.",
                type: "info",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteActivity = async () => {
    try {
      // Supprime l'activité
      await firestore().collection("activities").doc(activityId).delete();

      // Récupère toutes les conversations associées à l'activité
      const conversationsSnapshot = await firestore()
        .collection("conversations")
        .where("activityId", "==", activityId)
        .get();

      const deleteMessagesInConversation = async (conversationId) => {
        const messagesRef = firestore()
          .collection("messages")
          .where("conversationId", "==", conversationId);

        let hasNextPage = true;

        while (hasNextPage) {
          const messagesSnapshot = await messagesRef.limit(500).get();

          if (!messagesSnapshot.empty) {
            const batch = firestore().batch();

            messagesSnapshot.forEach((messageDoc) => {
              batch.delete(messageDoc.ref);
            });

            await batch.commit();
          }

          hasNextPage = !messagesSnapshot.empty;
        }
      };

      const batch = firestore().batch();

      // Supprime les messages et conversations
      for (const conversationDoc of conversationsSnapshot.docs) {
        const conversationId = conversationDoc.id;

        // Supprime les messages liés à cette conversation
        await deleteMessagesInConversation(conversationId);

        // Supprime la conversation elle-même
        batch.delete(conversationDoc.ref);
      }

      // Applique toutes les suppressions des conversations
      await batch.commit();
      showMessage({
        message:
          "Cet événement et toutes ses discussions ont bien été supprimés.",
        type: "info",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'activité :", error);
      showMessage({
        message: "Impossible de supprimer l'événement. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  const handleReport = () => {
  navigation.navigate('ReportReasonScreen', { activityId });
};


  const handleOpenMaps = () => {
    const { latitude, longitude } = coordinates;
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
      android: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch((err) =>
      console.error("Erreur d'ouverture:", err)
    );
  };

  const isUserParticipant = activity?.participants?.some(
    (participant) => participant.userId === userId
  );

  const isActiveParticipant = activity?.participants?.some(
    (participant) => participant.userId === userId && participant.active
  );

  const isAdmin = activity?.participants?.[0]?.userId === userId;

  const checkIfSaved = async () => {
    try {
      // Recherche dans la collection "saved" pour un document correspondant
      const savedQuery = await firestore()
        .collection("saved")
        .where("activityId", "==", activityId)
        .where("userId", "==", auth()?.currentUser?.uid)
        .get();

      // Si un document existe, on met `setSaved(true)`
      if (!savedQuery.empty) {
        setSaved(true);
      } else {
        setSaved(false);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des activités sauvegardées :",
        error
      );
    }
  };

  const handleSaved = async () => {
    try {
      const savedRef = firestore().collection("saved");

      if (saved) {
        // Si l'activité est déjà sauvegardée, on la supprime
        const savedQuery = await savedRef
          .where("activityId", "==", activityId)
          .where("userId", "==", auth()?.currentUser?.uid)
          .get();

        // Suppression des documents correspondants
        savedQuery.forEach(async (doc) => {
          await savedRef.doc(doc.id).delete();
        });

        setSaved(false);
        showMessage({
          message: "Evènement retiré de l'agenda.",
          type: "info",
        });
      } else {
        // Si l'activité n'est pas encore sauvegardée, on l'ajoute
        await savedRef.add({
          activityId: activityId,
          userId: auth()?.currentUser?.uid,
          savedAt: moment().format(),
        });

        setSaved(true);
        showMessage({
          message: "Evènement ajouté à l'agenda.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la gestion à l'agenda :", error);
      showMessage({
        message: "Une erreur est survenue. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.primary} size={"small"} />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {images && <ImageSlider images={images} />}
        <View style={{ marginTop: -40 }} className="px-7">
          <Animated.View
            entering={FadeInLeft.delay(400).duration(400)}
            className="flex-1"
          >
            <Image
              source={
                adminUser?.photoURL
                  ? { uri: adminUser?.photoURL }
                  : require("../../assets/img/user.png")
              }
              className="w-20 h-20 rounded-full"
            />
          </Animated.View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 text-xl mt-2 text-gray-900 dark:text-white"
                style={{ fontFamily: "Inter_700Bold" }}
              >
                @{adminUser?.username}
              </Text>

              {/* Badge Nouveauté */}
              {adminUser?.sub == "pro" ? (
                <View className="transform -rotate-10 bg-green-500 px-2 py-1 rounded-full">
                  <Text
                    style={{ fontFamily: "Inter_700Bold" }}
                    className="text-xs text-white tracking-wider"
                  >{i18n.t("entreprise")}</Text>
                </View>
              ) : (
                <View className="transform -rotate-10 bg-blue-500 px-2 py-1 rounded-full">
                  <Text
                    style={{ fontFamily: "Inter_700Bold" }}
                    className="text-xs text-white tracking-wider"
                  >{i18n.t("particulier")}</Text>
                </View>
              )}
            </View>

            <Text
              className="text-base mt-2 text-gray-500 dark:text-white"
              style={{ fontFamily: "Inter_500Medium" }}
            >
              {adminUser?.biography}
            </Text>
            <Text
              className="text-sm text-gray-400 dark:text-gray-300"
              style={{ fontFamily: "Inter_400Regular" }}
            >
              Membre depuis le{" "}
              {moment(adminUser?.createdAt).format("DD/MM/YYYY")}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row py-4 px-6"
        >
          {isAdmin && (
            <Pressable
              className="m-2 flex-row items-center justify-center bg-teal-500 px-4 py-2 rounded-full"
              onPress={() =>
                navigation.navigate("Participants", { activityId })
              }
            >
              <Text
                className="text-white text-sm "
                style={{ fontFamily: "Inter_500Medium" }}
              >{i18n.t("liste_des_participants")}</Text>
            </Pressable>
          )}

          {auth()?.currentUser && isUserParticipant && isActiveParticipant && (
            <Pressable
              className="m-2 flex-row items-center justify-center bg-blue-500 px-4 py-2 rounded-full"
              onPress={() => navigation.navigate("Conversations")}
            >
              <Text
                className="text-white text-sm "
                style={{ fontFamily: "Inter_500Medium" }}
              >{i18n.t("acceder_a_la_conversation")}</Text>
            </Pressable>
          )}

          {auth()?.currentUser &&
            !isUserParticipant &&
            activity.participants.length !== activity.maxParticipants && (
              <Pressable
                className="m-2 flex-row items-center justify-center bg-blue-600 px-4 py-2 rounded-full"
                onPress={handleJoinActivity}
              >
                <Text
                  className="text-white text-sm "
                  style={{ fontFamily: "Inter_500Medium" }}
                >
                  Rejoindre l'évènement{": "}
                  {activity?.price && Number(activity?.price) > 0
                    ? Number(activity?.price) + " €"
                    : "gratuit"}
                </Text>
              </Pressable>
            )}

          {auth()?.currentUser && isUserParticipant && !isActiveParticipant && (
            <Pressable
              className="m-2 flex-row items-center justify-center bg-yellow-500 px-4 py-2 rounded-full"
              onPress={handleLeaveActivity}
            >
              <Text
                className="text-white text-sm "
                style={{ fontFamily: "Inter_500Medium" }}
              >{i18n.t("en_attente_de_validation")}</Text>
            </Pressable>
          )}

          {auth()?.currentUser &&
            isUserParticipant &&
            isActiveParticipant &&
            !isAdmin && (
              <Pressable
                className="m-2 flex-row items-center justify-center bg-red-500 px-4 py-2 rounded-full"
                onPress={handleLeaveActivity}
              >
                <Text
                  className="text-white text-sm "
                  style={{ fontFamily: "Inter_500Medium" }}
                >{i18n.t("quitter_lactivite")}</Text>
              </Pressable>
            )}

          {!auth()?.currentUser && (
            <View className="">
              <Pressable
                onPress={() => navigation.jumpTo("Compte")}
                className="m-2 w-full bg-gray-200 py-2 px-3 rounded-full"
              >
                <Text
                  className="text-gray-700 text-sm text-center"
                  style={{ fontFamily: "Inter_500Medium" }}
                >{i18n.t("connectez_vous_pour_pouvoir_rejoindre_cet_evenement")}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
        {/* container global */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {/* Header: Titre et sous-titre */}
          <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Text
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight"
              style={{ fontFamily: "Inter_600SemiBold" }}
            >
              {activity.title}
            </Text>
            <View className="flex items-center mt-1">
              <Ionicons name="location-outline" size={16} color="#A1A1AA" />
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="ml-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {activity.location}
              </Text>
            </View>
          </View>

          {/* Section: Détails des participants */}
          <View className="px-6 py-4">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-gray-700 dark:text-gray-200 mb-2"
            >
              Participants :{" "}
              <Text className="font-semibold">
                {activity.participants.length}/{activity.maxParticipants}
              </Text>
            </Text>
            <View className="flex items-center space-x-2 mb-2">
              <Ionicons name="calendar-outline" size={16} color="#A1A1AA" />
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="ml-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {getFormattedDate(activity.date)}
              </Text>
            </View>
            <View className="flex items-center space-x-2">
              <Ionicons name="time-outline" size={16} color="#A1A1AA" />
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="ml-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {activity.time}
              </Text>
            </View>
          </View>

          {/* Section: Carte */}
          <View className="px-6 py-4">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-gray-700 dark:text-gray-200 mb-2"
            >{i18n.t("carte")}</Text>
            <Pressable
              onPress={handleOpenMaps}
              className="rounded-xl overflow-hidden"
            >
              <MapView
                pointerEvents="none"
                style={{ width: "100%", height: 200 }}
                region={coordinates}
              >
                <Circle
                  center={coordinates}
                  radius={4000}
                  strokeWidth={2}
                  strokeColor="rgba(0,0,255,0.5)"
                  fillColor="rgba(0,0,255,0.1)"
                />
              </MapView>
            </Pressable>
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400"
            >
              {distance && userPostalCode
                ? `${distance} en voiture depuis ${userPostalCode}`
                : ""}
            </Text>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        className="absolute right-4 bottom-0 w-16 h-16 rounded-full"
        onPress={handleReport} // ta fonction pour ouvrir un modal ou naviguer
        accessibilityRole="button"
        accessibilityLabel="Signaler ce profil"
        accessibilityHint="Appuyez pour signaler ce profil à la modération"
        style={{
          marginLeft: 10,
          padding: 6,
          backgroundColor: "#F87171", // rouge clair
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="flag-outline" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const Badge = ({ label }) => (
  <View className="bg-green-100 dark:bg-green-600 rounded-full px-3 py-1">
    <Text className="text-green-700 dark:text-green-100 text-xs">{label}</Text>
  </View>
);

export default ActivityDetails;
