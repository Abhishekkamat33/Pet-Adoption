import { ThemeProvider } from '../ThemeContext'; // Import ThemeProvider
import { UserProvider } from '../contexprovider/UserContextProvider'
import { Stack } from 'expo-router'; // Import Stack from expo-router
import { AnimalProvider } from '../contexprovider/AnimalsContextProvider'
import { OwnerProvider } from '../ChatContext/OwnerContextProvider'

export default function RootLayout() {

  return (
    <UserProvider>
      <AnimalProvider>
        <OwnerProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Screens that will be rendered inside the Stack Navigator */}
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="singleChatScreen/[id]" />
              <Stack.Screen name="directMessage/[id]" />
              <Stack.Screen name="Animal_History/animal_history" />
            </Stack>
          </ThemeProvider>
        </OwnerProvider>
      </AnimalProvider>

    </UserProvider>
  );
}
