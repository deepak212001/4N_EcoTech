/**
 * All navigation state and hooks live here (single stable hook order).
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {
  clearAuthToken,
  getCurrentUser,
  getProviderMe,
  setAuthToken,
} from './src/api/api';
import {
  cachedTokenMatchesSession,
  clearStoredAuth,
  loadCachedSession,
  loadStoredToken,
  saveAuth,
} from './src/auth/authStorage';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProviderDashboardScreen from './src/screens/ProviderDashboardScreen';
import ProviderDetailScreen from './src/screens/ProviderDetailScreen';
import ProviderListScreen from './src/screens/ProviderListScreen';
import ProviderLoginScreen from './src/screens/ProviderLoginScreen';
import ProviderRegisterScreen from './src/screens/ProviderRegisterScreen';
import RegisterScreen from './src/screens/RegisterScreen';

export type MainRoute =
  | { screen: 'dashboard' }
  | { screen: 'providers' }
  | { screen: 'detail'; providerId: string };

/** Same shape as login/register ApiResponse (token inside data). */
export type AppSession = {
  statusCode?: number;
  data?: Record<string, unknown>;
  message?: string;
  success?: number;
};

/** Align with ApiResponse + token in data (same shape as login). */
function buildSessionFromMe(
  me: {
    statusCode?: number;
    data?: Record<string, unknown>;
    message?: string;
    success?: number;
  },
  token: string,
): AppSession {
  const u = me?.data ?? {};
  return {
    statusCode: me?.statusCode ?? 200,
    data: { ...u, token },
    message: me?.message ?? 'User fetched successfully',
    success: me?.success ?? 200,
  };
}

export default function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AppSession | null>(null);
  const [authScreen, setAuthScreen] = useState<
    'login' | 'register' | 'providerLogin' | 'providerRegister'
  >('login');
  const [mainRoute, setMainRoute] = useState<MainRoute>({
    screen: 'dashboard',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await loadStoredToken();
        if (!token) {
          return;
        }
        setAuthToken(token);

        try {
          let me: {
            statusCode?: number;
            data?: Record<string, unknown>;
            message?: string;
            success?: number;
          };
          try {
            me = await getCurrentUser();
          } catch (err: unknown) {
            const st =
              err && typeof err === 'object' && 'status' in err
                ? (err as { status?: number }).status
                : undefined;
            if (st === 403) {
              me = await getProviderMe();
            } else {
              throw err;
            }
          }
          if (cancelled) {
            return;
          }
          const nextSession = buildSessionFromMe(me, token);
          setSession(nextSession);
          await saveAuth(nextSession);
        } catch (e: unknown) {
          const status =
            e && typeof e === 'object' && 'status' in e
              ? (e as { status?: number }).status
              : undefined;
          if (status === 401) {
            clearAuthToken();
            await clearStoredAuth();
            if (!cancelled) {
              setSession(null);
            }
          } else {
            const cached = await loadCachedSession();
            if (
              cached &&
              cachedTokenMatchesSession(cached, token) &&
              !cancelled
            ) {
              setSession(cached);
            } else if (!cancelled) {
              const restored: AppSession = {
                statusCode: 200,
                data: { token },
                message: 'Restored',
                success: 200,
              };
              setSession(restored);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setMainRoute({ screen: 'dashboard' });
    }
  }, [session]);

  function commitSession(data: AppSession | null) {
    setSession(data);
    if (data) {
      saveAuth(data as { data?: { token?: string } }).catch(() => {});
    }
  }

  let body: React.ReactNode;

  if (!hydrated) {
    body = (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  } else if (!session) {
    if (authScreen === 'providerRegister') {
      body = (
        <ProviderRegisterScreen
          onRegistered={data => commitSession(data)}
          onBackToProviderLogin={() => setAuthScreen('providerLogin')}
        />
      );
    } else if (authScreen === 'providerLogin') {
      body = (
        <ProviderLoginScreen
          onLoggedIn={data => commitSession(data)}
          onGoToProviderRegister={() => setAuthScreen('providerRegister')}
          onBackToPatient={() => setAuthScreen('login')}
        />
      );
    } else if (authScreen === 'register') {
      body = (
        <RegisterScreen
          onRegistered={data => commitSession(data)}
          onGoToLogin={() => setAuthScreen('login')}
        />
      );
    } else {
      body = (
        <LoginScreen
          onLoggedIn={data => commitSession(data)}
          onGoToRegister={() => setAuthScreen('register')}
          onLoginAsProvider={() => setAuthScreen('providerLogin')}
        />
      );
    }
  } else if (session?.data?.role === 'provider') {
    body = (
      <ProviderDashboardScreen
        session={session}
        onSessionUpdate={next => {
          setSession(next);
          saveAuth(next as { data?: { token?: string } }).catch(() => {});
        }}
        onLogout={async () => {
          clearAuthToken();
          try {
            await clearStoredAuth();
          } catch {
            /* still leave app */
          }
          setSession(null);
        }}
      />
    );
  } else if (mainRoute.screen === 'dashboard') {
    body = (
      <HomeScreen
        session={session}
        onLogout={async () => {
          clearAuthToken();
          try {
            await clearStoredAuth();
          } catch {
            /* still leave app */
          }
          setSession(null);
        }}
        onBookAppointment={() => setMainRoute({ screen: 'providers' })}
      />
    );
  } else if (mainRoute.screen === 'providers') {
    body = (
      <ProviderListScreen
        onBack={() => setMainRoute({ screen: 'dashboard' })}
        onSelectProvider={id =>
          setMainRoute({ screen: 'detail', providerId: String(id) })
        }
      />
    );
  } else {
    body = (
      <ProviderDetailScreen
        providerId={mainRoute.providerId}
        onBack={() => setMainRoute({ screen: 'providers' })}
        onBooked={() => setMainRoute({ screen: 'dashboard' })}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {body}
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
