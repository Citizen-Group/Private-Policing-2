import { Image, View, ScrollView } from 'react-native';
import { Button, Text, Switch } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { PlateInput } from '@/libraries/citizen/components/plate-input';

// DB helpers (you already have these or will soon)
import { insertPlate, updatePlate } from '@/libraries/citizen/db/database';

export default function DetailsScreen() {
  const { id, fullImage, plateImage, text, type, editing } = useLocalSearchParams();

  const isEditing = editing === 'true';

  // Unified form state
  const [form, setForm] = useState({
    plateText: (text as string) ?? '',
    type: (type as string) ?? 'ocr',

    // future fields:
    // location: null,
    // officerId: '',
    // notes: '',
    // direction: '',
  });

  // Controlled plate input
  function handlePlateChange(newPlate: string) {
    setForm(prev => ({ ...prev, plateText: newPlate }));
  }

  // Toggles (hidden in edit mode)
  const [autoSend, setAutoSend] = useState(true);
  const [rapidCapture, setRapidCapture] = useState(false);

  // Mock POST (always fails for now)
  async function mockPost(record: any) {
    await new Promise(res => setTimeout(res, 500)); // simulate network delay
    throw new Error("Mock failure");
  }

  // Submit handler
  async function handleSubmit() {
    const record = {
      fullImage,
      plateImage,
      plateText: form.plateText,
      type: form.type,
      createdAt: Date.now(),
      sent: 0,
      sendError: 0,
    };

    let recordId = id;

    if (isEditing) {
      // Update existing record
      await updatePlate(Number(id), record);
      recordId = id;
    } else {
      // Insert new record
      recordId = await insertPlate(record);
    }

    // Auto-send logic
    if (autoSend && !isEditing) {
      try {
        await mockPost(record);
        await updatePlate(Number(recordId), { sent: 1, sendError: 0 });
      } catch (err) {
        await updatePlate(Number(recordId), { sent: 0, sendError: 1 });
      }
    }

    // Navigation logic
    if (rapidCapture && !isEditing) {
      router.replace('/(tabs)/actions/manual'); // back to camera
    } else {
      router.replace('/(tabs)/logs'); // to logs page
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        {isEditing ? "Edit Entry" : "Scan Result"}
      </Text>

      <Text variant="titleMedium">Full Image:</Text>
      <Image
        source={{ uri: fullImage as string }}
        style={{ width: '100%', height: 300, marginBottom: 20 }}
        resizeMode="contain"
      />

      <Text variant="titleMedium">Edit Plate:</Text>
      <PlateInput
        value={form.plateText}
        onChange={handlePlateChange}
        plateImage={plateImage as string}
      />

      {/* Toggles only visible when NOT editing */}
      {!isEditing && (
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Switch value={autoSend} onValueChange={setAutoSend} />
            <Text style={{ marginLeft: 10 }}>Auto Send</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Switch value={rapidCapture} onValueChange={setRapidCapture} />
            <Text style={{ marginLeft: 10 }}>Rapid Capture</Text>
          </View>
        </View>
      )}

      {/* Reject only when not editing */}
      {!isEditing && (
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
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={{ marginTop: 10 }}
        disabled={form.plateText.length === 0}
      >
        {isEditing ? "Save Changes" : "Submit"}
      </Button>
    </ScrollView>
  );
}