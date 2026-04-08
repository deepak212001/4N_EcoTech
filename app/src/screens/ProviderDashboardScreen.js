import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  API_BASE_URL,
  getAuthToken,
  getProviderMe,
  listProviderBookings,
  updateProviderSlots,
} from '../api/api';

function formatYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHM(d) {
  const h = d.getHours();
  const min = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Parse `YYYY-MM-DD` from server / list into local midnight Date. */
function parseYMDString(ymd) {
  const parts = String(ymd)
    .trim()
    .split('-')
    .map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
    return startOfDay(new Date());
  }
  const [y, m, d] = parts;
  return startOfDay(new Date(y, m - 1, d));
}

/** Pure merge for one day into the schedule (used by Add + Save). */
function computeMergedSchedule(currentDays, dateStr, extraSlots) {
  const d = dateStr.trim();
  const merged = new Map(
    currentDays.map(day => [day.date, [...(day.slots || [])]]),
  );
  const prev = merged.get(d) || [];
  const next = [...new Set([...prev, ...extraSlots])].sort();
  merged.set(d, next);
  return [...merged.entries()]
    .map(([date, slots]) => ({ date, slots }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function ProviderDashboardScreen({
  session,
  onLogout,
  onSessionUpdate,
}) {
  const insets = useSafeAreaInsets();
  const displayName = session?.data?.name || 'Provider';
  const category = session?.data?.category;

  const [items, setItems] = useState([]);
  const [slotDays, setSlotDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [error, setError] = useState('');

  const [draftDate, setDraftDate] = useState(() => startOfDay(new Date()));
  const [draftTimes, setDraftTimes] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  /** iOS only — Android time uses imperative DateTimePickerAndroid.open (no hook-based picker). */
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const [bookRes, meRes] = await Promise.all([
        listProviderBookings(),
        getProviderMe(),
      ]);
      const list = Array.isArray(bookRes?.data) ? bookRes.data : [];
      setItems(list);
      const slots = meRes?.data?.availableSlots;
      if (Array.isArray(slots)) {
        setSlotDays(slots.map(d => ({ ...d, slots: [...(d.slots || [])] })));
      } else {
        setSlotDays([]);
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
      setItems([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
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

  function mergeDay(dateStr, extraSlots) {
    const d = dateStr.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setError('Use date format YYYY-MM-DD (e.g. 2026-04-15)');
      return;
    }
    setError('');
    setSlotDays(computeMergedSchedule(slotDays, d, extraSlots));
    setDraftTimes([]);
  }

  function openTimePicker() {
    const d = new Date();
    d.setSeconds(0, 0);
    if (draftTimes.length > 0) {
      const last = draftTimes[draftTimes.length - 1];
      const parts = last.split(':').map(Number);
      if (parts.length >= 2 && !Number.isNaN(parts[0])) {
        d.setHours(parts[0], parts[1] || 0, 0, 0);
      } else {
        d.setHours(9, 0, 0, 0);
      }
    } else {
      d.setHours(9, 0, 0, 0);
    }
    setTimePickerValue(d);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: d,
        mode: 'time',
        is24Hour: false,
        display: 'default',
        onChange: (event, date) => {
          if (event?.type === 'dismissed') {
            return;
          }
          if (date) {
            setTimePickerValue(date);
            const s = formatHM(date);
            setDraftTimes(prev => [...new Set([...prev, s])].sort());
          }
        },
      });
      return;
    }

    setShowTimePicker(true);
  }

  function handleAddDay() {
    const dateStr = formatYMD(draftDate);
    if (draftTimes.length === 0) {
      setError('Add at least one time (tap Pick time)');
      return;
    }
    setError('');
    mergeDay(dateStr, draftTimes);
  }

  function onDateChange(event, date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event?.type === 'dismissed') {
      return;
    }
    if (date) {
      setDraftDate(startOfDay(date));
    }
  }

  /** iOS modal wheel — add chip without closing. */
  function addDraftTimeFromPicker() {
    const s = formatHM(timePickerValue);
    setDraftTimes(prev => [...new Set([...prev, s])].sort());
  }

  function removeDraftTime(t) {
    setDraftTimes(prev => prev.filter(x => x !== t));
  }

  function removeDay(date) {
    setSlotDays(prev => prev.filter(x => x.date !== date));
  }

  function removeTime(date, time) {
    setSlotDays(prev =>
      prev
        .map(day => {
          if (day.date !== date) {
            return day;
          }
          const slots = (day.slots || []).filter(t => t !== time);
          return { date, slots };
        })
        .filter(day => (day.slots || []).length > 0),
    );
  }

  async function handleSaveSlots() {
    setSavingSlots(true);
    setError('');
    try {
      let schedule = slotDays;
      if (draftTimes.length > 0) {
        const dateStr = formatYMD(draftDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          setError('Pick a valid date');
          return;
        }
        schedule = computeMergedSchedule(slotDays, dateStr, draftTimes);
        setSlotDays(schedule);
        setDraftTimes([]);
      }
      if (schedule.length === 0) {
        setError(
          'Add times (Pick time), then save — or tap Add to schedule first.',
        );
        return;
      }
      // console.log('schedule', schedule);
      // console.warn('schedule', schedule);
      // console.error('schedule', schedule);
      const res = await updateProviderSlots(schedule);
      const d = res?.data;
      const token = session?.data?.token ?? getAuthToken() ?? null;
      if (d && onSessionUpdate && token) {
        onSessionUpdate({
          ...session,
          data: { ...session.data, ...d, token },
        });
      }
      try {
        await load();
      } catch (loadErr) {
        setError(
          `Saved on server. Refresh failed: ${
            loadErr?.message || loadErr
          }. Pull down to retry.`,
        );
      }
    } catch (e) {
      setError(e.message || 'Could not save availability');
    } finally {
      setSavingSlots(false);
    }
  }

  async function testServerReachable() {
    setError('');
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/providers`;
    try {
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();
      setError(
        `Test OK (${res.status}): ${url}\n` +
          (text.length > 120 ? `${text.slice(0, 120)}…` : text),
      );
    } catch (e) {
      setError(
        `Test FAILED: ${e?.message || e}\nURL: ${url}\n` +
          'Fix DEV_HOST in app/src/config/apiBaseUrl.js (ipconfig → IPv4). Same Wi‑Fi as PC.',
      );
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{displayName}</Text>
          {category ? <Text style={styles.sub}>{category}</Text> : null}
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.banner}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a78bfa" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Your availability</Text>
          {/* <Text style={styles.sectionHint}>
            {Platform.OS === 'android'
              ? 'Android: Pick time → system clock opens → OK adds that time. Repeat Pick time for more slots, then Save availability.'
              : 'Pick date → Pick time → Add time for each slot, then Done. Then Save availability.'}
          </Text> */}

          {slotDays.length === 0 ? (
            <Text style={styles.muted}>
              No slots yet — add a date and times below.
            </Text>
          ) : (
            slotDays.map(day => (
              <View key={day.date} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{day.date}</Text>
                  <View style={styles.dayHeaderActions}>
                    <TouchableOpacity
                      style={styles.dayHeaderActionBtn}
                      onPress={() => {
                        setError('');
                        setDraftDate(parseYMDString(day.date));
                        openTimePicker();
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addMoreTimes}>+ more times</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeDay(day.date)}>
                      <Text style={styles.removeDay}>Remove day</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.chipRow}>
                  {(day.slots || []).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={styles.chip}
                      onPress={() => removeTime(day.date, t)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipText}>{t}</Text>
                      <Text style={styles.chipX}> ×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}

          <Text style={styles.formLabel}>Add or extend a day</Text>
          <TouchableOpacity
            style={styles.selectRow}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.selectLabel}>Date</Text>
            <Text style={styles.selectValue}>{formatYMD(draftDate)}</Text>
            <Text style={styles.selectChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectRow}
            onPress={openTimePicker}
            activeOpacity={0.85}
          >
            <Text style={styles.selectLabel}>Pick time</Text>
            <Text style={styles.selectHint}>Clock · add one or more</Text>
            <Text style={styles.selectChevron}>›</Text>
          </TouchableOpacity>
          {draftTimes.length > 0 ? (
            <View style={styles.draftChipRow}>
              {draftTimes.map(t => (
                <TouchableOpacity
                  key={t}
                  style={styles.chip}
                  onPress={() => removeDraftTime(t)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>{t}</Text>
                  <Text style={styles.chipX}> ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedSmall}>No times for this day yet.</Text>
          )}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddDay}
            activeOpacity={0.88}
          >
            <Text style={styles.addBtnText}>Add to schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, savingSlots && styles.saveBtnDisabled]}
            onPress={handleSaveSlots}
            disabled={savingSlots}
            activeOpacity={0.88}
          >
            {savingSlots ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save availability</Text>
            )}
          </TouchableOpacity>

          {/* <Text style={styles.apiHint} selectable>
            API base: {API_BASE_URL}
          </Text>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={testServerReachable}
            activeOpacity={0.85}
          >
            <Text style={styles.testBtnText}>Test server (no login)</Text>
          </TouchableOpacity> */}

          <Text style={[styles.sectionTitle, styles.bookingsTitle]}>
            Bookings
          </Text>
          <Text style={styles.sectionHint}>Who booked with you</Text>

          {items.length === 0 ? (
            <Text style={styles.empty}>No appointments yet.</Text>
          ) : (
            items.map(item => {
              const user = item.userId;
              const patientName =
                typeof user === 'object' && user?.name ? user.name : 'Patient';
              const patientEmail =
                typeof user === 'object' && user?.email ? user.email : '—';
              return (
                <View key={String(item._id)} style={styles.card}>
                  <Text style={styles.patientName}>{patientName}</Text>
                  <Text style={styles.patientEmail}>{patientEmail}</Text>
                  <Text style={styles.slot}>
                    {item.date} · {item.time}
                  </Text>
                  <Text
                    style={[
                      styles.status,
                      item.status === 'cancelled' && styles.statusCancelled,
                    ]}
                  >
                    {item.status === 'cancelled' ? 'Cancelled' : 'Booked'}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {!loading && Platform.OS === 'android' && showDatePicker ? (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      ) : null}

      {!loading && Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="spinner"
                themeVariant="dark"
                onChange={(_, date) => {
                  if (date) {
                    setDraftDate(startOfDay(date));
                  }
                }}
              />
              <TouchableOpacity
                style={styles.modalDone}
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.88}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* iOS: modal + wheel + Add time / Done (Android time = DateTimePickerAndroid.open in openTimePicker) */}
      {!loading && Platform.OS === 'ios' ? (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addDraftTimeFromPicker}
                  activeOpacity={0.88}
                >
                  <Text
                    style={[styles.modalActionText, styles.modalActionPrimary]}
                  >
                    Add time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.modalActionText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={timePickerValue}
                mode="time"
                display="spinner"
                is24Hour={false}
                themeVariant="dark"
                onChange={(_, date) => {
                  if (date) {
                    setTimePickerValue(date);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
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
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  sub: {
    fontSize: 14,
    color: '#c4b5fd',
    marginTop: 4,
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e9d5ff',
    marginBottom: 6,
  },
  bookingsTitle: {
    marginTop: 28,
  },
  sectionHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 18,
  },
  muted: {
    color: '#64748b',
    marginBottom: 16,
    fontSize: 14,
  },
  mutedSmall: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 10,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
    width: 88,
  },
  selectValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'right',
    marginRight: 4,
  },
  selectHint: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'right',
    marginRight: 4,
  },
  selectChevron: {
    fontSize: 22,
    color: '#64748b',
    fontWeight: '300',
  },
  draftChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  modalDone: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalDoneText: {
    color: '#a78bfa',
    fontSize: 17,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#475569',
  },
  modalActionText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActionPrimary: {
    color: '#c4b5fd',
  },
  dayCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayHeaderActionBtn: {
    marginRight: 14,
  },
  addMoreTimes: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  removeDay: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312e81',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#e9d5ff',
    fontSize: 14,
    fontWeight: '600',
  },
  chipX: {
    color: '#fda4af',
    fontSize: 14,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 8,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: '#5b21b6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  apiHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 16,
  },
  testBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginBottom: 16,
  },
  testBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
  },
  patientEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  slot: {
    fontSize: 14,
    color: '#c4b5fd',
    marginTop: 10,
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
});
