import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Slider, Rating } from "react-native-elements";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import { COLORS } from "../styles/colors";
import { showMessage } from "react-native-flash-message";

const EditEvent = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [location, setLocation] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventDoc = await firestore()
          .collection("activities")
          .doc(eventId)
          .get();
        if (eventDoc.exists) {
          const data = eventDoc.data();
          setTitle(data.title);
          setDescription(data.description);
          setMaxParticipants(data.maxParticipants);
          setSelectedDate(data.date);
          setSelectedTime(data.time);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données de l'événement :",
          error
        );
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleValidation = () => {
    let valid = true;
    let tempErrors = {};

    if (!title.trim()) {
      valid = false;
      tempErrors.title = "Le titre est obligatoire.";
    }
    if (!description.trim()) {
      valid = false;
      tempErrors.description = "La description est obligatoire.";
    }
    if (maxParticipants < 2 || maxParticipants > 20) {
      valid = false;
      tempErrors.maxParticipants =
        "Le nombre de participants doit être compris entre 2 et 20.";
    }
    if (!selectedDate) {
      valid = false;
      tempErrors.date = "La date est obligatoire.";
    }
    if (!selectedTime) {
      valid = false;
      tempErrors.time = "L'heure est obligatoire.";
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleSave = async () => {
    if (handleValidation()) {
      try {
        await firestore().collection("activities").doc(eventId).update({
          title,
          description,
          maxParticipants,
          date: selectedDate,
          time: selectedTime,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        showMessage({
          message: "L'événement a été mis à jour avec succès",
          type: "success",
        });
        navigation.goBack();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'événement :", error);
       
        showMessage({
            message: "Une erreur s'est produite lors de la mise à jour de l'événement.",
            type: "error",
          });
      }
    } else {
      Alert.alert(
        "Erreur",
        "Veuillez corriger les erreurs avant de sauvegarder."
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      className="p-4 bg-white dark:bg-gray-900"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
    >
      <View className="">
        {/* Champ Titre */}
        <View>
          <TextInput
            className="bg-gray-100 dark:bg-gray-800 rounded-t-lg px-4 py-3 text-lg text-gray-800 dark:text-white"
            placeholder="Nom de l'événement"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors((prev) => ({ ...prev, title: "" }));
            }}
          />
          {errors.title && (
            <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
          )}
        </View>

        {/* Champ Description */}
        <View className="mb-4">
          <TextInput
            className="bg-gray-100 dark:bg-gray-800 rounded-b-lg px-4 py-3 text-lg text-gray-800 dark:text-white"
            placeholder="Description de l'événement"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            multiline
            numberOfLines={4}
          />
          {errors.description && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.description}
            </Text>
          )}
        </View>

        {/* Slider Nombre de Participants */}
        <View>
          <Text className="text-lg  text-gray-900 dark:text-white mt-4 mb-2">{i18n.t("nombre_de_participants_max")}</Text>
          <Slider
            value={maxParticipants}
            onValueChange={(value) => {
              setMaxParticipants(value);
              setErrors((prev) => ({ ...prev, maxParticipants: "" }));
            }}
            minimumValue={2}
            maximumValue={20}
            step={1}
            thumbTintColor={COLORS.primary}
            thumbStyle={{
              height: 25,
              width: 25,
              backgroundColor: COLORS.primary,
            }}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#d1d5db"
          />
          <Text className="text-center text-base mt-2 text-gray-900 dark:text-white">
            {maxParticipants}/20
          </Text>
          {errors.maxParticipants && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.maxParticipants}
            </Text>
          )}
        </View>

        {/* Sélection de la date */}
        <View>
          <Text
            className="text-base mt-4 text-gray-900 dark:text-white"
            style={{
              fontFamily: "Inter_400Regular",
            }}
          >{i18n.t("date")}</Text>
          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.8}
          >
            <View
              className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-4 border-b border-gray-300 dark:border-gray-700"
              style={{
                justifyContent: "center",
              }}
            >
              <Text
                className="text-lg text-gray-800 dark:text-white"
                style={{
                  fontFamily: "Inter_400Regular",
                }}
              >
                {selectedDate || "Sélectionnez une date"}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.date && (
            <Text className="text-red-500 text-sm mt-1">{errors.date}</Text>
          )}
        </View>

        {/* Sélection de l'heure */}
        <View className="mb-8">
          <Text
            className="mt-4 text-base text-gray-900 dark:text-white"
            style={{
              fontFamily: "Inter_400Regular",
            }}
          >{i18n.t("heure")}</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <View
              className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-4 text-lg border-b border-gray-300 dark:border-gray-700"
              style={{
                justifyContent: "center",
              }}
            >
              <Text
                className="text-lg text-gray-800 dark:text-white"
                style={{
                  fontFamily: "Inter_400Regular",
                }}
              >
                {selectedTime || "Sélectionnez une heure"}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.time && (
            <Text className="text-red-500 text-sm mt-1">{errors.time}</Text>
          )}
        </View>

        {/* Bouton Sauvegarder */}
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-500 py-3 rounded-lg"
        >
          <Text className="text-white text-center text-lg ">{i18n.t("sauvegarder_les_modifications")}</Text>
        </TouchableOpacity>
      </View>
      {/* Modal pour le calendrier */}
      {showCalendar && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 10,
                margin: 20,
                padding: 16,
              }}
            >
              <Calendar
                theme={{
                  textDayFontFamily: "Inter_500Medium",
                  textMonthFontFamily: "Inter_500Medium",
                  textDayHeaderFontFamily: "Inter_500Medium",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                  backgroundColor: "#ffffff",
                  calendarBackground: "#ffffff",
                  textSectionTitleColor: "#b6c1cd",
                  selectedDayBackgroundColor: "#00adf5",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#00adf5",
                  dayTextColor: "#2d4150",
                  textDisabledColor: "#d9e1e8",
                }}
                onDayPress={(day) => {
                  const [year, month, date] = day.dateString.split("-");
                  setSelectedDate(`${date}/${month}/${year}`);
                  setShowCalendar(false);
                }}
                markedDates={{
                  [new Date().toISOString().split("T")[0]]: {
                    disabled: true,
                    disableTouchEvent: true,
                  },
                }}
                minDate={new Date().toISOString().split("T")[0]}
              />

              <TouchableOpacity
                style={{
                  marginTop: 10,
                  backgroundColor: "#3b82f6",
                  padding: 10,
                  borderRadius: 5,
                }}
                onPress={() => setShowCalendar(false)}
              >
                <Text
                  className="text-base"
                  style={{
                    textAlign: "center",
                    color: "#ffffff",
                    fontFamily: "Inter_400Regular",
                  }}
                >{i18n.t("fermer")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* Modal pour le sélecteur d'heure */}
      {showTimePicker && (
        <Modal transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 10,
                margin: 20,
                padding: 16,
              }}
            >
              <Picker
                label="Choisir une heure"
                value=""
                itemStyle={{
                  backgroundColor: "white",
                  color: "black",
                }}
                selectedValue={selectedTime}
                onValueChange={(itemValue) => {
                  setSelectedTime(itemValue);
                }}
              >
                <Picker.Item label="00:00" value="00:00" />
                <Picker.Item label="00:15" value="00:15" />
                <Picker.Item label="00:30" value="00:30" />
                <Picker.Item label="00:45" value="00:45" />
                <Picker.Item label="01:00" value="01:00" />
                <Picker.Item label="01:15" value="01:15" />
                <Picker.Item label="01:30" value="01:30" />
                <Picker.Item label="01:45" value="01:45" />
                <Picker.Item label="02:00" value="02:00" />
                <Picker.Item label="02:15" value="02:15" />
                <Picker.Item label="02:30" value="02:30" />
                <Picker.Item label="02:45" value="02:45" />
                <Picker.Item label="03:00" value="03:00" />
                <Picker.Item label="03:15" value="03:15" />
                <Picker.Item label="03:30" value="03:30" />
                <Picker.Item label="03:45" value="03:45" />
                <Picker.Item label="04:00" value="04:00" />
                <Picker.Item label="04:15" value="04:15" />
                <Picker.Item label="04:30" value="04:30" />
                <Picker.Item label="04:45" value="04:45" />
                <Picker.Item label="05:00" value="05:00" />
                <Picker.Item label="05:15" value="05:15" />
                <Picker.Item label="05:30" value="05:30" />
                <Picker.Item label="05:45" value="05:45" />
                <Picker.Item label="06:00" value="06:00" />
                <Picker.Item label="06:15" value="06:15" />
                <Picker.Item label="06:30" value="06:30" />
                <Picker.Item label="06:45" value="06:45" />
                <Picker.Item label="07:00" value="07:00" />
                <Picker.Item label="07:15" value="07:15" />
                <Picker.Item label="07:30" value="07:30" />
                <Picker.Item label="07:45" value="07:45" />
                <Picker.Item label="08:00" value="08:00" />
                <Picker.Item label="08:15" value="08:15" />
                <Picker.Item label="08:30" value="08:30" />
                <Picker.Item label="08:45" value="08:45" />
                <Picker.Item label="09:00" value="09:00" />
                <Picker.Item label="09:15" value="09:15" />
                <Picker.Item label="09:30" value="09:30" />
                <Picker.Item label="09:45" value="09:45" />
                <Picker.Item label="10:00" value="10:00" />
                <Picker.Item label="10:15" value="10:15" />
                <Picker.Item label="10:30" value="10:30" />
                <Picker.Item label="10:45" value="10:45" />
                <Picker.Item label="11:00" value="11:00" />
                <Picker.Item label="11:15" value="11:15" />
                <Picker.Item label="11:30" value="11:30" />
                <Picker.Item label="11:45" value="11:45" />
                <Picker.Item label="12:00" value="12:00" />
                <Picker.Item label="12:15" value="12:15" />
                <Picker.Item label="12:30" value="12:30" />
                <Picker.Item label="12:45" value="12:45" />
                <Picker.Item label="13:00" value="13:00" />
                <Picker.Item label="13:15" value="13:15" />
                <Picker.Item label="13:30" value="13:30" />
                <Picker.Item label="13:45" value="13:45" />
                <Picker.Item label="14:00" value="14:00" />
                <Picker.Item label="14:15" value="14:15" />
                <Picker.Item label="14:30" value="14:30" />
                <Picker.Item label="14:45" value="14:45" />
                <Picker.Item label="15:00" value="15:00" />
                <Picker.Item label="15:15" value="15:15" />
                <Picker.Item label="15:30" value="15:30" />
                <Picker.Item label="15:45" value="15:45" />
                <Picker.Item label="16:00" value="16:00" />
                <Picker.Item label="16:15" value="16:15" />
                <Picker.Item label="16:30" value="16:30" />
                <Picker.Item label="16:45" value="16:45" />
                <Picker.Item label="17:00" value="17:00" />
                <Picker.Item label="17:15" value="17:15" />
                <Picker.Item label="17:30" value="17:30" />
                <Picker.Item label="17:45" value="17:45" />
                <Picker.Item label="18:00" value="18:00" />
                <Picker.Item label="18:15" value="18:15" />
                <Picker.Item label="18:30" value="18:30" />
                <Picker.Item label="18:45" value="18:45" />
                <Picker.Item label="19:00" value="19:00" />
                <Picker.Item label="19:15" value="19:15" />
                <Picker.Item label="19:30" value="19:30" />
                <Picker.Item label="19:45" value="19:45" />
                <Picker.Item label="20:00" value="20:00" />
                <Picker.Item label="20:15" value="20:15" />
                <Picker.Item label="20:30" value="20:30" />
                <Picker.Item label="20:45" value="20:45" />
                <Picker.Item label="21:00" value="21:00" />
                <Picker.Item label="21:15" value="21:15" />
                <Picker.Item label="21:30" value="21:30" />
                <Picker.Item label="21:45" value="21:45" />
                <Picker.Item label="22:00" value="22:00" />
                <Picker.Item label="22:15" value="22:15" />
                <Picker.Item label="22:30" value="22:30" />
                <Picker.Item label="22:45" value="22:45" />
                <Picker.Item label="23:00" value="23:00" />
                <Picker.Item label="23:15" value="23:15" />
                <Picker.Item label="23:30" value="23:30" />
                <Picker.Item label="23:45" value="23:45" />
              </Picker>

              <TouchableOpacity
                style={{
                  marginTop: 10,
                  backgroundColor: "#3b82f6",
                  padding: 10,
                  borderRadius: 5,
                }}
                onPress={() => setShowTimePicker(false)}
              >
                <Text
                  style={{
                    textAlign: "center",
                    color: "#ffffff",
                    fontFamily: "Inter_400Regular",
                  }}
                >{i18n.t("fermer")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAwareScrollView>
  );
};

export default EditEvent;
