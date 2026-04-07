import React, {useCallback, useState} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {cancelAppointment, getMyAppointments} from "../api/appointments";
import {getErrorMessage} from "../api/client";

function MyAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");

  const fetchAppointments = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const data = await getMyAppointments();
      setAppointments(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments(true);
    }, [])
  );

  const onCancel = async (id) => {
    if (cancellingId) return;
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      Alert.alert("Success", "Appointment cancelled.");
      await fetchAppointments(false);
    } catch (e) {
      Alert.alert("Error", getErrorMessage(e));
    } finally {
      setCancellingId("");
    }
  };

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
        data={appointments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAppointments(false);
            }}
          />
        }
        ListEmptyComponent={<Text>You have no appointments yet.</Text>}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.providerId?.name || "Provider"}</Text>
            <Text style={styles.meta}>
              {item.date} | {item.time}
            </Text>
            <Text
              style={[
                styles.status,
                item.status === "cancelled" ? styles.cancelled : styles.booked,
              ]}>
              {item.status}
            </Text>
            {item.status === "booked" ? (
              <Pressable
                style={styles.cancelButton}
                onPress={() => onCancel(item._id)}
                disabled={cancellingId === item._id}>
                <Text style={styles.cancelButtonText}>
                  {cancellingId === item._id ? "Cancelling..." : "Cancel Appointment"}
                </Text>
              </Pressable>
            ) : null}
          </View>
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
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    color: "#444",
  },
  status: {
    textTransform: "capitalize",
    fontWeight: "600",
  },
  booked: {
    color: "#046d32",
  },
  cancelled: {
    color: "#b00020",
  },
  cancelButton: {
    marginTop: 6,
    backgroundColor: "#b00020",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
    marginBottom: 8,
  },
});

export default MyAppointmentsScreen;
