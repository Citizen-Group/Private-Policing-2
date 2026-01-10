import { useTheme, PaperProvider, Button } from 'react-native-paper';
import { Link } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';


export default function Index() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/(tabs)/actions/patrol" asChild>
            <Button labelStyle={{...theme.fonts.bodyMedium}} mode="contained">
              Patrol (Auto)
            </Button>
          </Link>
          <Link href="/(tabs)/actions/station" asChild>
            <Button style={{ marginTop: 40}} labelStyle={{...theme.fonts.bodyMedium}} mode="contained">
              Deploy Speed Camera (Stationary)
            </Button>
          </Link>
          <Link href="/(tabs)/actions/manual" asChild>
            <Button style={{ marginTop: 40}} labelStyle={{...theme.fonts.bodyMedium}} mode="contained">
              Scan License Plate (Manual) 
            </Button>
          </Link>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}