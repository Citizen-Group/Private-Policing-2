import { Image, View, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { PlateInput } from '@/libraries/citizen/components/plate-input';

export default function DetailsScreen() {
  const { fullImage, plateImage, text } = useLocalSearchParams();
  const [plate, setPlate] = useState((text as string) ?? '');

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Scan Result</Text>

      <Text variant="titleMedium">Full Image:</Text>
      <Image
        source={{ uri: fullImage as string }}
        style={{ width: '100%', height: 300, marginBottom: 20 }}
        resizeMode="contain"
      />

      <Text variant="titleMedium">Edit Plate:</Text>
      <PlateInput value={plate} onChange={setPlate} plateImage={plateImage as string} />

      <Button
        mode="contained"
        onPress={() =>
          router.push({
            pathname: '/(tabs)/actions/manual/select',
            params: { fullImage },
          })
        }
        style={{ marginTop: 20 }}
      >
        Reject Image
      </Button>

      <Button
        mode="contained"
        onPress={() =>
          router.push({
            pathname: '/(tabs)/actions/manual/confirm',
            params: { plate, fullImage, plateImage },
          })
        }
        style={{ marginTop: 10 }}
        disabled={plate.length === 0}
      >
        Continue
      </Button>
    </ScrollView>

  );
}