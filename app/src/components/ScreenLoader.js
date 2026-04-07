import React from "react";
import {ActivityIndicator, StyleSheet, Text, View} from "react-native";

function ScreenLoader({label = "Loading..."}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  text: {
    color: "#444",
  },
});

export default ScreenLoader;
