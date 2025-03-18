import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from '../../ThemeContext'; 

export default function TabLayout() {
  const { isDarkMode } = useTheme(); // Get the current theme (dark mode or light mode)

  // Dynamically set tabBar styles based on the theme
  const tabBarStyle = {
    borderTopWidth: 0,
    backgroundColor: isDarkMode ? '#121212' : '#fff', // Dark mode background or light mode background
    shadowColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)', // Change shadow color based on theme
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 1,
  };

  const tabBarActiveTintColor = isDarkMode ? '#fff' : '#000'; // Active icon color
  const tabBarInactiveTintColor = isDarkMode ? '#ccc' : '#888'; // Inactive icon color

  return (
    <Tabs 
      initialRouteName="index" 
      lazy={true} 
      lazyPreload={true} 
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="watchlist"
        options={{
          tabBarIcon: ({ color }) => <AntDesign size={28} name="hearto" color={color} />,
        }}        
      />

      <Tabs.Screen 
        name="cart" 
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{
              marginBottom: 30, 
              width: 50, 
              height: 50, 
              borderRadius: 25,
              backgroundColor: isDarkMode ? '#333' : '#dadadada', // Change cart icon background color based on theme
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <AntDesign size={28} name="plus" color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="message"
        options={{
          tabBarIcon: ({ color }) => <AntDesign size={28} name="message1" color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <AntDesign size={28} name="setting" color={color} />,
        }}
      />
    </Tabs>
  );
}
