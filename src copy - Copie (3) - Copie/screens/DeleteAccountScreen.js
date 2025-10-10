import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { COLORS } from "../styles/colors";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { auth } from "../../config/firebase";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from "firebase/auth";
import { showMessage } from "react-native-flash-message";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@env";



export default function DeleteAccountScreen({ navigation }) {
  const [reasons] = useState([
  "Préoccupations concernant la confidentialité",
  "J'ai trouvé un meilleur service",
  "Trop cher",
  "Je n'utilise plus l'application",
  "Problèmes techniques",
  "Autre",
]);

  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [sending, setSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  const handleSelectReason = (reason) => {
    setSelectedReason(reason);
    setModalVisible(false);
    if (reason !== "Other") setCustomReason("");
  };

  const validateAndShowConfirmation = () => {
    if (!selectedReason || (selectedReason === "Other" && !customReason.trim())) {
      showMessage({
        message: "Erreur",
        description: "Veuillez sélectionner une raison ou la saisir.",
        type: "danger",
        icon: "danger",
        duration: 3000,
      });
      return;
    }
    setConfirmationModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    setConfirmationModalVisible(false);
    setSending(true);

    // Call goodbye API with reason and user email
    try {
      await fetch(`${API_URL}/goodbye.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.currentUser?.email,
          reason: selectedReason === "Other" ? customReason.trim() : selectedReason,
          deletedAt: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn("API goodbye error:", e);
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await user.delete();

      showMessage({
        message: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès.",
        type: "success",
        icon: "success",
        duration: 4000,
      });
    
    } catch (e) {
      // If recent login required, prompt user for password then retry deletion
      if (e.code === "auth/requires-recent-login") {
        setSending(false);
        Alert.prompt(
          "Vérification de sécurité",
          "Pour votre sécurité, veuillez saisir votre mot de passe pour confirmer la suppression de votre compte.",
          async (password) => {
            if (!password) return;
            setSending(true);
            try {
              const cred = EmailAuthProvider.credential(
                auth.currentUser.email, 
                password
              );
              await reauthenticateWithCredential(auth.currentUser, cred);
              await auth.currentUser.delete();
              
              showMessage({
                message: "Compte supprimé",
                description: "Votre compte a été supprimé avec succès.",
                type: "success",
                icon: "success",
                duration: 4000,
              });
              
             
            } catch (error) {
              showMessage({
                message: "Erreur",
                description: "Mot de passe invalide. Veuillez réessayer.",
                type: "danger",
                icon: "danger",
                duration: 4000,
              });
            } finally {
              setSending(false);
            }
          },
          "secure-text"
        );
      } else {
        showMessage({
          message: "Erreur",
          description: "Impossible de supprimer le compte. Veuillez vous reconnecter et réessayer.",
          type: "danger",
          icon: "danger",
          duration: 4000,
        });
        setSending(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-2xl mb-2 text-primary"
            style={{ fontFamily: "OpenSans_700Bold" }}
          >
            Supprimer mon compte
          </Text>
          <Text
            className="text-gray-500 text-sm"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            Cette action est irréversible
          </Text>
        </View>

        {/* Warning Banner */}
        <View className="bg-red-50 border border-red-200 rounded p-4 mb-6 flex-row">
          <Ionicons name="warning" size={24} color="#EF4444" style={{ marginRight: 12 }} />
          <View className="flex-1">
            <Text
              className="text-red-800 text-sm mb-1"
              style={{ fontFamily: "OpenSans_700Bold" }}
            >
              Attention
            </Text>
            <Text
              className="text-red-700 text-xs"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              La suppression de votre compte entraînera la perte définitive de toutes vos données, paramètres et contenus.
            </Text>
          </View>
        </View>

        {/* Reason Selection */}
        <Text
          className="text-gray-700 text-base mb-3"
          style={{ fontFamily: "OpenSans_600SemiBold" }}
        >
          Pourquoi voulez-vous supprimer votre compte ?
        </Text>

        <Pressable
          onPress={() => setModalVisible(true)}
          className="border border-gray-300 bg-gray-50 rounded py-4 px-4 mb-4 flex-row justify-between items-center"
        >
          <Text
            className={`text-base flex-1 ${
              selectedReason ? "text-primary" : "text-gray-400"
            }`}
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {selectedReason || "Choisir une raison"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Custom Reason Input */}
        {selectedReason === "Other" && (
          <View className="mb-6">
            <TextInput
              value={customReason}
              onChangeText={(text) =>
                text.length <= 250 ? setCustomReason(text) : null
              }
              placeholder="Veuillez préciser la raison..."
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded py-3 px-4 bg-white text-primary text-base min-h-[100px]"
              style={{ 
                fontFamily: "OpenSans_400Regular",
                textAlignVertical: "top",
              }}
              multiline
              maxLength={250}
            />
            <Text
              className="text-gray-400 text-xs mt-2 text-right"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {customReason.length}/250
            </Text>
          </View>
        )}

        {/* What happens info */}
        <View className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <Text
            className="text-blue-900 text-sm mb-2"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            Ce qui sera supprimé :
          </Text>
          <View className="space-y-1">
            {[
              "Votre profil et informations personnelles",
              "Toutes vos données et paramètres",
              "Votre historique d'utilisation",
              "Accès à tous les services associés",
            ].map((item, index) => (
              <View key={index} className="flex-row items-start mb-1">
                <Text className="text-blue-700 mr-2">•</Text>
                <Text
                  className="text-blue-800 text-xs flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delete Button */}
        <Pressable
          onPress={validateAndShowConfirmation}
          disabled={sending || !selectedReason || (selectedReason === "Other" && !customReason.trim())}
          className={`rounded py-4 items-center flex-row justify-center ${
            sending || !selectedReason || (selectedReason === "Other" && !customReason.trim())
              ? "bg-red-400"
              : "bg-red-600"
          }`}
          style={{ 
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text
                className="text-white text-base"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Supprimer définitivement
              </Text>
            </>
          )}
        </Pressable>

        {/* Cancel Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={sending}
          className="rounded py-4 items-center mt-3"
        >
          <Text
            className="text-gray-600 text-base"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            Annuler
          </Text>
        </Pressable>

        {/* Reason Selection Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View
              style={{
                backgroundColor: "#fff",
                minWidth: "80%",
                maxWidth: "90%",
                paddingVertical: 8,
                elevation: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
              }}
            >
              <View className="px-4 py-3 border-b border-gray-200">
                <Text
                  style={{
                    fontFamily: "OpenSans_600SemiBold",
                    fontSize: 18,
                    color: COLORS.primary,
                  }}
                >
                  Sélectionnez une raison
                </Text>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {reasons.map((reason, i) => (
                  <TouchableOpacity
                    key={reason}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderBottomColor: i < reasons.length - 1 ? "#F3F4F6" : "transparent",
                      borderBottomWidth: i < reasons.length - 1 ? 1 : 0,
                      backgroundColor: selectedReason === reason ? "#F0F9FF" : "transparent",
                    }}
                    onPress={() => handleSelectReason(reason)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        style={{
                          fontFamily: "OpenSans_400Regular",
                          fontSize: 16,
                          color: selectedReason === reason ? COLORS.primary : "#374151",
                        }}
                      >
                        {reason}
                      </Text>
                      {selectedReason === reason && (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Confirmation Modal */}
        <Modal visible={confirmationModalVisible} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                width: "100%",
                maxWidth: 400,
                padding: 24,
                elevation: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}
            >
              <View className="items-center mb-4">
                <View className="bg-red-100 rounded p-3 mb-3">
                  <Ionicons name="alert-circle" size={48} color="#DC2626" />
                </View>
                <Text
                  className="text-xl text-center text-gray-900 mb-2"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  Confirmer la suppression
                </Text>
                <Text
                  className="text-sm text-center text-gray-600"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  Êtes-vous absolument sûr(e) de vouloir supprimer votre compte ? Cette action est définitive et irréversible.
                </Text>
              </View>

              <View className="space-y-2">
                <Pressable
                  onPress={handleDeleteAccount}
                  className="bg-red-600 rounded py-4 items-center mb-2"
                  style={{ 
                    shadowColor: "#DC2626",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    Oui, supprimer définitivement
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setConfirmationModalVisible(false)}
                  className="bg-gray-100 rounded py-4 items-center"
                >
                  <Text
                    className="text-gray-700 text-base"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    Annuler
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}