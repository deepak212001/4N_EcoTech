/**
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppContent from './AppContent';

/** No hooks here — avoids "Rendered more hooks than during the previous render" with HMR / strict trees. */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
