/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { clearAuthToken } from './src/api/api';
import LoginScreen from './src/screens/LoginScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [session, setSession] = useState(null);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {session ? (
        <HomeAfterLogin
          onLogout={() => {
            clearAuthToken();
            setSession(null);
          }}
        />
      ) : (
        <LoginScreen onLoggedIn={data => setSession(data)} />
      )}
    </SafeAreaProvider>
  );
}

function HomeAfterLogin({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={styles.home}>
      <Text style={styles.homeTitle}>Logged in</Text>
      <Text style={styles.homeHint}>Backend se token save ho chuka hai (memory).</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  home: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  homeHint: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  logoutText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
