import React from "react";
import { ActivityIndicator, View } from "react-native";

const index = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

export default index;
