import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { register } from '../api/api';

export default function RegisterScreen({ onRegistered, onGoToLogin }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!name.trim()) {
      setError('Name enter karein');
      return;
    }
    if (!email.trim()) {
      setError('Email enter karein');
      return;
    }
    if (!password) {
      setError('Password enter karein');
      return;
    }
    if (password.length < 6) {
      setError('Password kam se kam 6 characters ka ho');
      return;
    }

    setLoading(true);
    try {
      const data = await register({ name, email, password });
      onRegistered?.(data);
    } catch (e) {
      setError(e.message || 'Register fail ho gaya');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account banayein</Text>
        <Text style={styles.subtitle}>
          Name, email aur password se sign up karein
        </Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Aapka naam"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Kam se kam 6 characters"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          onSubmitEditing={handleSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={onGoToLogin}
          disabled={loading}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
          <Text style={styles.linkMuted}>Pehle se account hai? </Text>
          <Text style={styles.link}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  error: {
    color: '#f87171',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  linkMuted: {
    fontSize: 15,
    color: '#94a3b8',
  },
  link: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
