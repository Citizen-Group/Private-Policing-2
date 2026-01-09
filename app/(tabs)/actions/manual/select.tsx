import { View, Text, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function DetailsScreen() {
  const { fullImage, plateImage, text } = useLocalSearchParams();

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Scan Result</Text>

      <Text style={{ fontSize: 18 }}>Full Image:</Text>
      <Image
        source={{ uri: fullImage as string }}
        style={{ width: '100%', height: 300, marginBottom: 20 }}
      />

      <Text style={{ fontSize: 18 }}>Cropped Plate:</Text>
      <Image
        source={{ uri: plateImage as string }}
        style={{ width: '100%', height: 120, marginBottom: 20 }}
      />

      <Text style={{ fontSize: 18 }}>OCR Text:</Text>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginTop: 10 }}>
        {text}
      </Text>
    </ScrollView>
  );
}