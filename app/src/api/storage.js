import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

async function saveAuth(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

async function clearAuth() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

async function getStoredAuth() {
  const [token, userJson] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  return {
    token: token?.[1] || null,
    user: userJson?.[1] ? JSON.parse(userJson[1]) : null,
  };
}

export {TOKEN_KEY, saveAuth, clearAuth, getStoredAuth};
