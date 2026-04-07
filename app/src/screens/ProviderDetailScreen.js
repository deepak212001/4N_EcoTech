import React, {useEffect, useMemo, useState} from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {bookAppointment, getProvider} from "../api/appointments";
import {getErrorMessage} from "../api/client";

function ProviderDetailScreen({route, navigation}) {
  const {providerId} = route.params;
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const allSlots = useMemo(() => {
    if (!provider?.availableSlots) return [];
    return provider.availableSlots.flatMap((day) =>
      (day.slots || []).map((slot) => ({
        date: day.date,
        time: slot,
        key: `${day.date}-${slot}`,
      }))
    );
  }, [provider]);

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true);
      setError("");
      try {
        const data = await getProvider(providerId);
        setProvider(data);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    fetchProvider();
  }, [providerId]);

  const handleBook = async () => {
    if (!selected || booking) return;
    setBooking(true);
    try {
      await bookAppointment({
        providerId: provider._id,
        date: selected.date,
        time: selected.time,
      });
      Alert.alert("Success", "Appointment booked successfully.");
      navigation.navigate("MyAppointments");
    } catch (e) {
      Alert.alert("Booking failed", getErrorMessage(e));
    } finally {
      setBooking(false);
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
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {provider ? (
        <>
          <Text style={styles.title}>{provider.name}</Text>
          <Text style={styles.subtitle}>{provider.category}</Text>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          {allSlots.length === 0 ? (
            <Text>No slots available.</Text>
          ) : (
            <View style={styles.slotWrap}>
              {allSlots.map((slot) => (
                <Pressable
                  key={slot.key}
                  style={[
                    styles.slotButton,
                    selected?.key === slot.key && styles.slotButtonActive,
                  ]}
                  onPress={() => setSelected(slot)}>
                  <Text
                    style={[
                      styles.slotText,
                      selected?.key === slot.key && styles.slotTextActive,
                    ]}>
                    {slot.date} | {slot.time}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Button
            title={booking ? "Booking..." : "Book Selected Slot"}
            onPress={handleBook}
            disabled={!selected || booking}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    minHeight: "100%",
    gap: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#555",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 6,
  },
  slotWrap: {
    gap: 8,
    marginBottom: 10,
  },
  slotButton: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    padding: 10,
  },
  slotButtonActive: {
    borderColor: "#0b63f6",
    backgroundColor: "#eaf1ff",
  },
  slotText: {
    color: "#222",
  },
  slotTextActive: {
    color: "#0b63f6",
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
    marginBottom: 8,
  },
});

export default ProviderDetailScreen;
