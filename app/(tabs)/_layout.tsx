import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function TabLayout() {
  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffd33d',
          headerStyle: {
            backgroundColor: '#25292e',
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: '#25292e',
          },
          headerShown: true
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="logs/index"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
      {/* Bad code but it will hold for now. Supresses children in tabs*/}
      <Tabs.Screen
        name="actions/manual"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="actions/patrol"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="actions/station"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}
