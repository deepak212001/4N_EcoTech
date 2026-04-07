import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cancelAppointment as cancelAppointmentApi,
  listMyAppointments,
} from '../api/api';

export default function HomeScreen({
  session,
  onLogout,
  onBookAppointment,
}) {
  const insets = useSafeAreaInsets();
  const displayName =
    session?.data?.name || session?.data?.email || 'User';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await listMyAppointments();
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } catch (e) {
      setError(e.message || 'Failed to load appointments');
      setItems([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleCancel(id) {
    setCancellingId(id);
    setError('');
    try {
      await cancelAppointmentApi(id);
      setItems(prev =>
        prev.map(a =>
          String(a._id) === String(id) ? {...a, status: 'cancelled'} : a,
        ),
      );
    } catch (e) {
      setError(e.message || 'Could not cancel');
    } finally {
      setCancellingId(null);
    }
  }

  function renderItem({ item }) {
    const provider = item.providerId;
    const providerName =
      typeof provider === 'object' && provider?.name
        ? provider.name
        : 'Provider';
    const canCancel = item.status === 'booked';
    const busy = cancellingId === item._id;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{providerName}</Text>
        <Text style={styles.cardMeta}>
          {item.date} · {item.time}
        </Text>
        <Text
          style={[
            styles.status,
            item.status === 'cancelled' && styles.statusCancelled,
          ]}>
          {item.status === 'cancelled' ? 'Cancelled' : 'Booked'}
        </Text>
        {canCancel ? (
          <TouchableOpacity
            style={[styles.cancelBtn, busy && styles.cancelBtnDisabled]}
            onPress={() => handleCancel(item._id)}
            disabled={busy}
            activeOpacity={0.85}>
            {busy ? (
              <ActivityIndicator color="#fecaca" size="small" />
            ) : (
              <Text style={styles.cancelText}>Cancel</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {displayName}</Text>
          <Text style={styles.sub}>Your appointments</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.bookPrimary}
        onPress={onBookAppointment}
        activeOpacity={0.88}>
        <Text style={styles.bookPrimaryText}>Book appointment</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.banner}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No appointments yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  bookPrimary: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  bookPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  logoutText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#450a0a',
    color: '#fecaca',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    marginTop: 32,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
  },
  cardMeta: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4ade80',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  statusCancelled: {
    color: '#94a3b8',
  },
  cancelBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#7f1d1d',
    minWidth: 88,
    alignItems: 'center',
  },
  cancelBtnDisabled: {
    opacity: 0.7,
  },
  cancelText: {
    color: '#fecaca',
    fontSize: 15,
    fontWeight: '600',
  },
});
