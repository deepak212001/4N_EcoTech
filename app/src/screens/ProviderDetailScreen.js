import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookAppointment, getProviderById } from '../api/api';

export default function ProviderDetailScreen({
  providerId,
  onBack,
  onBooked,
}) {
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await getProviderById(providerId);
      const p = res?.data;
      setProvider(p || null);
      if (!p) {
        setError('Provider not found');
      }
    } catch (e) {
      setError(e.message || 'Failed to load provider');
      setProvider(null);
    }
  }, [providerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSelected(null);
      await load();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleConfirm() {
    if (!selected || !provider) {
      return;
    }
    setBooking(true);
    setError('');
    try {
      await bookAppointment({
        providerId: provider._id,
        date: selected.date,
        time: selected.time,
      });
      Alert.alert('Booked', 'Your appointment is confirmed.', [
        { text: 'OK', onPress: () => onBooked?.() },
      ]);
    } catch (e) {
      setError(e.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  }

  const days = provider?.availableSlots || [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Details</Text>
        <View style={styles.backPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {provider ? (
            <>
              <Text style={styles.name}>{provider.name}</Text>
              <Text style={styles.category}>{provider.category}</Text>

              {error ? <Text style={styles.banner}>{error}</Text> : null}

              <Text style={styles.sectionLabel}>Available slots</Text>
              {days.length === 0 ? (
                <Text style={styles.muted}>No open slots right now.</Text>
              ) : (
                days.map(day => (
                  <View key={day.date} style={styles.dayBlock}>
                    <Text style={styles.dayTitle}>{day.date}</Text>
                    <View style={styles.slotRow}>
                      {(day.slots || []).map(slot => {
                        const active =
                          selected?.date === day.date &&
                          selected?.time === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            style={[styles.slot, active && styles.slotActive]}
                            onPress={() =>
                              setSelected({ date: day.date, time: slot })
                            }
                            activeOpacity={0.85}>
                            <Text
                              style={[
                                styles.slotText,
                                active && styles.slotTextActive,
                              ]}>
                              {slot}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[
                  styles.confirm,
                  (!selected || booking || days.length === 0) &&
                    styles.confirmDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!selected || booking || days.length === 0}
                activeOpacity={0.88}>
                {booking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Confirm booking</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.muted}>{error || 'Unable to load provider.'}</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 72,
  },
  backText: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '600',
  },
  backPlaceholder: {
    width: 72,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  category: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 6,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  banner: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#450a0a',
    color: '#fecaca',
    fontSize: 14,
    marginBottom: 16,
  },
  muted: {
    color: '#64748b',
    fontSize: 15,
  },
  dayBlock: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  slotActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#3b82f6',
  },
  slotText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#fff',
  },
  confirm: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.45,
  },
  confirmText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
