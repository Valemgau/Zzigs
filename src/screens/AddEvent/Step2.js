import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { COLORS } from "../../styles/colors";
import { useColorScheme } from "nativewind";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";

const Step2 = ({ onNext, onPrevious }) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Initialisation de la date par défaut au lendemain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [selectedDate, setSelectedDate] = useState(formatDate(tomorrow));
  const [selectedTime, setSelectedTime] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onNext({ date: selectedDate, time: selectedTime });
    } else {
      showMessage({
        message: "Erreur",
        description: "Veuillez sélectionner une date et une heure.",
        type: "warning",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      scrollEnabled
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraHeight={150}
       contentContainerClassName="px-7 py-10 pb-32 bg-white dark:bg-gray-900"
      showsVerticalScrollIndicator={false}
    >
      <Text
        className="text-2xl text-gray-900 dark:text-white"
        style={{ fontFamily: "Inter_700Bold" }}
      >{i18n.t("date_et_heure")}</Text>
      <Text
        className="mt-2 text-lg text-gray-500 dark:text-gray-400"
        style={{
          fontFamily: "Inter_400Regular",
        }}
      >{i18n.t("il_ny_a_pas_de_meilleurs_moments_pour_se_retrouver")}</Text>
      {/* Sélection de la date */}
      <Text
        className="text-lg mt-8 text-gray-900 dark:text-white"
        style={{
          fontFamily: "Inter_500Medium",
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
                backgroundColor: isDarkMode ? "#0f172a" : "white",
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
                  backgroundColor: isDarkMode ? "#0f172a" : "white",
                  calendarBackground: isDarkMode ? "#0f172a" : "white",
                  textSectionTitleColor: isDarkMode ? "#9ca3af" : "#b6c1cd",
                  selectedDayBackgroundColor: "#3b82f6",
                  selectedDayTextColor: "#ffffff",
                  todayTextColor: "#3b82f6",
                  dayTextColor: isDarkMode ? "#d1d5db" : "#2d4150",
                  textDisabledColor: isDarkMode ? "#4b5563" : "#d9e1e8",
                  monthTextColor: isDarkMode ? "#ffffff" : "#2d4150",
                  arrowColor: isDarkMode ? "#ffffff" : "#2d4150",
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
      {/* Sélection de l'heure */}
      <Text
        className="mt-4 text-lg text-gray-900 dark:text-white"
        style={{
          fontFamily: "Inter_500Medium",
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
                backgroundColor: isDarkMode ? "#0f172a" : "white",
                borderRadius: 10,
                margin: 20,
                padding: 16,
              }}
            >
              <Picker
                label="Choisir une heure"
                value=""
                itemStyle={{
                  backgroundColor: isDarkMode ? "#0f172a" : "white",
                  color: isDarkMode ? "white" : "black",
                }}
                style={{
                  backgroundColor: isDarkMode ? "#1a1a1a" : "white",
                  color: isDarkMode ? "white" : "black",
                }}
                dropdownIconColor={isDarkMode ? "white" : "black"}
                selectedValue={selectedTime}
                onValueChange={(itemValue) => {
                  setSelectedTime(itemValue);
                }}
              >
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="00:00"
                  value="00:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="00:15"
                  value="00:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="00:30"
                  value="00:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="00:45"
                  value="00:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="01:00"
                  value="01:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="01:15"
                  value="01:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="01:30"
                  value="01:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="01:45"
                  value="01:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="02:00"
                  value="02:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="02:15"
                  value="02:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="02:30"
                  value="02:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="02:45"
                  value="02:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="03:00"
                  value="03:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="03:15"
                  value="03:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="03:30"
                  value="03:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="03:45"
                  value="03:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="04:00"
                  value="04:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="04:15"
                  value="04:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="04:30"
                  value="04:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="04:45"
                  value="04:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="05:00"
                  value="05:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="05:15"
                  value="05:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="05:30"
                  value="05:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="05:45"
                  value="05:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="06:00"
                  value="06:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="06:15"
                  value="06:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="06:30"
                  value="06:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="06:45"
                  value="06:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="07:00"
                  value="07:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="07:15"
                  value="07:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="07:30"
                  value="07:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="07:45"
                  value="07:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="08:00"
                  value="08:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="08:15"
                  value="08:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="08:30"
                  value="08:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="08:45"
                  value="08:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="09:00"
                  value="09:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="09:15"
                  value="09:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="09:30"
                  value="09:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="09:45"
                  value="09:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="10:00"
                  value="10:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="10:15"
                  value="10:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="10:30"
                  value="10:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="10:45"
                  value="10:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="11:00"
                  value="11:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="11:15"
                  value="11:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="11:30"
                  value="11:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="11:45"
                  value="11:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="12:00"
                  value="12:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="12:15"
                  value="12:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="12:30"
                  value="12:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="12:45"
                  value="12:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="13:00"
                  value="13:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="13:15"
                  value="13:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="13:30"
                  value="13:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="13:45"
                  value="13:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="14:00"
                  value="14:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="14:15"
                  value="14:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="14:30"
                  value="14:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="14:45"
                  value="14:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="15:00"
                  value="15:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="15:15"
                  value="15:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="15:30"
                  value="15:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="15:45"
                  value="15:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="16:00"
                  value="16:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="16:15"
                  value="16:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="16:30"
                  value="16:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="16:45"
                  value="16:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="17:00"
                  value="17:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="17:15"
                  value="17:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="17:30"
                  value="17:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="17:45"
                  value="17:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="18:00"
                  value="18:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="18:15"
                  value="18:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="18:30"
                  value="18:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="18:45"
                  value="18:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="19:00"
                  value="19:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="19:15"
                  value="19:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="19:30"
                  value="19:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="19:45"
                  value="19:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="20:00"
                  value="20:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="20:15"
                  value="20:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="20:30"
                  value="20:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="20:45"
                  value="20:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="21:00"
                  value="21:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="21:15"
                  value="21:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="21:30"
                  value="21:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="21:45"
                  value="21:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="22:00"
                  value="22:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="22:15"
                  value="22:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="22:30"
                  value="22:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="22:45"
                  value="22:45"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="23:00"
                  value="23:00"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="23:15"
                  value="23:15"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="23:30"
                  value="23:30"
                />
                <Picker.Item
                  color={isDarkMode ? "#888" : "#666"}
                  label="23:45"
                  value="23:45"
                />
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
                    fontFamily: "Inter_500Medium",
                  }}
                >{i18n.t("fermer")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* Bouton Suivant */}
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary }}
        onPress={handleNext}
        activeOpacity={0.8}
        className="py-3 mt-5 rounded-lg "
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >{i18n.t("suivant")}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default Step2;
