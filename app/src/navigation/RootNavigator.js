import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {Button, Text, View} from "react-native";
import {useAuth} from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProviderDetailScreen from "../screens/ProviderDetailScreen";
import MyAppointmentsScreen from "../screens/MyAppointmentsScreen";
import ScreenLoader from "../components/ScreenLoader";
import {StyleSheet} from "react-native";

const Stack = createNativeStackNavigator();

function HeaderActions({onOpenAppointments, onLogout}) {
  return (
    <View style={styles.headerActions}>
      <Button title="My Appointments" onPress={onOpenAppointments} />
      <Button title="Logout" onPress={onLogout} />
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const {logout} = useAuth();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({navigation}) => ({
          title: "Providers",
          headerRight: () => (
            <HeaderActions
              onOpenAppointments={() => navigation.navigate("MyAppointments")}
              onLogout={logout}
            />
          ),
        })}
      />
      <Stack.Screen
        name="ProviderDetail"
        component={ProviderDetailScreen}
        options={{title: "Provider Detail"}}
      />
      <Stack.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{title: "My Appointments"}}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const {isBootstrapping, isLoggedIn} = useAuth();

  if (isBootstrapping) {
    return <ScreenLoader label="Checking session..." />;
  }

  return (
    <NavigationContainer fallback={<Text>Loading navigation...</Text>}>
      {isLoggedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
});

export default RootNavigator;
