import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#16a34a',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'FacePay' }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Register' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
