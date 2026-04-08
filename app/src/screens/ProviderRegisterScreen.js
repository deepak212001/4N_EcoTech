import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { providerRegister } from '../api/api';

export default function ProviderRegisterScreen({
  onRegistered,
  onBackToProviderLogin,
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [profilePreviewUri, setProfilePreviewUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pickProfileImage() {
    setError('');
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.88,
      selectionLimit: 1,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      setError(result.errorMessage || 'Could not open photo library');
      return;
    }
    const asset = result.assets && result.assets[0];
    if (!asset) {
      setError('No image selected');
      return;
    }
    if (!asset.base64) {
      setError('Could not read image data. Try another photo.');
      return;
    }
    const mime = asset.type || 'image/jpeg';
    setImageBase64(`data:${mime};base64,${asset.base64}`);
    if (asset.uri) setProfilePreviewUri(asset.uri);
  }

  function clearProfileImage() {
    setProfilePreviewUri(null);
    setImageBase64(null);
  }

  async function handleSubmit() {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!category.trim()) {
      setError('Please enter a category (e.g. Dentistry)');
      return;
    }

    setLoading(true);
    try {
      const data = await providerRegister({
        name,
        email,
        password,
        category,
        ...(imageBase64 ? { imageBase64 } : {}),
      });
      onRegistered?.(data);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Provider registration</Text>
        <Text style={styles.subtitle}>
          Create an account to list your practice and see bookings
        </Text>

        <Text style={styles.label}>Profile photo (optional)</Text>
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            {profilePreviewUri ? (
              <Image
                source={{ uri: profilePreviewUri }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarPlaceholder}>?</Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={pickProfileImage}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>
                {profilePreviewUri ? 'Change photo' : 'Choose photo'}
              </Text>
            </TouchableOpacity>
            {profilePreviewUri ? (
              <TouchableOpacity
                onPress={clearProfileImage}
                disabled={loading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearPhoto}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text style={styles.label}>Practice / Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="Dr. Jane Doe"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dentistry, Cardiology"
          placeholderTextColor="#94a3b8"
          value={category}
          onChangeText={setCategory}
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
          placeholder="At least 6 characters"
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
            <Text style={styles.buttonText}>Create provider account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={onBackToProviderLogin}
          disabled={loading}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
          <Text style={styles.linkMuted}>Already registered? </Text>
          <Text style={styles.link}>Provider sign in</Text>
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
  scroll: {
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
    marginBottom: 20,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 32,
    fontWeight: '600',
    color: '#64748b',
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryBtnText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  clearPhoto: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#7c3aed',
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
    color: '#a78bfa',
    fontWeight: '600',
  },
});
