import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import i18n from '../../i18n';

export default function Statistiques() {
  return (
    <SafeAreaView className='flex-1'>
      <Text className='p-10 text-3xl'>{i18n.t("une_erreur_est_survenue_contactez_votre_developpeur")}</Text>
    </SafeAreaView>
  );
}