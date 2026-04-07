import React, {useCallback, useState} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {listProviders} from "../api/appointments";
import {getErrorMessage} from "../api/client";

function HomeScreen({navigation}) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchProviders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const data = await listProviders();
      setProviders(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProviders(true);
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={providers}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProviders(false);
            }}
          />
        }
        ListEmptyComponent={<Text>No providers found.</Text>}
        renderItem={({item}) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("ProviderDetail", {providerId: item._id})
            }>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.category}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  meta: {
    marginTop: 4,
    color: "#555",
  },
  error: {
    color: "#b00020",
    marginBottom: 10,
  },
});

export default HomeScreen;
