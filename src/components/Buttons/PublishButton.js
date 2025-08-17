import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { Entypo, Feather } from "@expo/vector-icons";



export default function PublishButton({onPress}) {
  return (
    <Pressable
    onPress={onPress}
    className="z-20 absolute bottom-24 right-5 w-14 h-14 rounded-full bg-green-500 flex-row items-center justify-center"
  >
    {/* <Text
      style={{ fontFamily: "Inter_400Regular" }}
      className="text-white text-sm mr-1"
    >
      Publier
    </Text> */}
    <Feather name="plus" size={25} color="white" />
  </Pressable>
  )
}