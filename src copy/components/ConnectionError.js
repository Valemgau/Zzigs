import { View, Text, Image } from "react-native";
import React from "react";
import i18n from "../../i18n";

export default function ConnectionError() {
  return (
    <View className="bg-blue-50 flex-1 items-center justify-center px-10">
      <Image
        className="w-32 h-32"
        source={require("../../assets/img/x.png")}
      />
      <Text
        style={{ fontFamily: "Inter_500Medium" }}
        className="mt-10 mb-3 text-base text-black text-center "
      >{i18n.t("erreur_de_connexion_reseau")}</Text>
      <Text style={{ fontFamily: "Inter_300Light" }} className=" text-center text-sm text-black">
        Votre connexion n'est pas stable actuellement {"\n"}
        • Vérifiez votre WI-FI {"\n"}
        • Vérifiez votre 5G/4G {"\n"}
      </Text>
    </View>
  );
}
