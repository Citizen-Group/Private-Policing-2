import { View, Alert, Linking } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useRef, useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';
import cropImage from '@/libraries/citizen/crop-helper';
import { Button, Text, Surface, useTheme } from 'react-native-paper';

export default function CameraScreen() {
  const theme = useTheme();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'not-determined' | 'denied' | 'restricted'>('not-determined');

  // Request permission on mount
  useEffect(() => {
    async function check() {
      const status = await Camera.getCameraPermissionStatus();

      if (status === 'granted') {
        setPermission('granted');
        return;
      }

      const newStatus = await Camera.requestCameraPermission();
      setPermission(newStatus);
    }

    check();
  }, []);

  // Simple heuristic to pick the most “plate-like” block
  const findPlateCandidate = useCallback((blocks: TextBlock[]): TextBlock | undefined => {
    return blocks
      .filter(b => /[A-Z]/i.test(b.text) && /\d/.test(b.text))
      .sort((a, b) => b.text.length - a.text.length)[0];
  }, []);

  const capture = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    try {
      const cam = cameraRef.current;
      if (!cam) {
        console.warn('Camera ref not ready');
        return;
      }

      const photo = await cam.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      const fullImagePath = `file://${photo.path}`;

      const result = await TextRecognition.recognize(fullImagePath);
      const candidate = findPlateCandidate(result.blocks);

      if (candidate && candidate.frame) {
        const { left, top, width, height } = candidate.frame;
        const correctedFrame = { left, top, width, height };

        const croppedPath = await cropImage(fullImagePath, correctedFrame);

        const croppedOCR = await TextRecognition.recognize(croppedPath);
        const candidate2 = findPlateCandidate(croppedOCR.blocks);

        if (!candidate2) {
          console.warn('No plate-like text found in cropped image');
          return;
        }

        await router.push({
          pathname: '/(tabs)/actions/manual/details',
          params: {
            fullImage: fullImagePath,
            plateImage: croppedPath,
            text: candidate2.text ?? '',
          },
        });
      } else {
        await router.push({
          pathname: '/(tabs)/actions/manual/select',
          params: { fullImage: fullImagePath },
        });
      }
    } catch (err) {
      console.error('Capture error:', err);
      Alert.alert('Error', String(err));
    } finally {
      setBusy(false);
    }
  }, [busy, findPlateCandidate]);

  // PERMISSION GATE UI (React Native Paper)
  if (permission !== 'granted') {
    const blocked = permission === 'denied';

    return (
      <Surface
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text variant="headlineSmall" style={{ marginBottom: 12 }}>
          Camera Permission Needed
        </Text>

        <Text
          variant="bodyMedium"
          style={{ textAlign: 'center', marginBottom: 24, opacity: 0.8 }}
        >
          This app needs access to your camera to scan license plates.
        </Text>

        {!blocked && (
          <Button
            mode="contained"
            onPress={async () => {
              const newStatus = await Camera.requestCameraPermission();
              setPermission(newStatus);
            }}
            style={{ marginBottom: 12 }}
          >
            Grant Permission
          </Button>
        )}

        {blocked && (
          <Button
            mode="contained"
            onPress={() => Linking.openSettings()}
            style={{ marginBottom: 12 }}
          >
            Open Settings
          </Button>
        )}

        <Button
          mode="text"
          onPress={() => router.back()}
        >
          Cancel
        </Button>
      </Surface>
    );
  }

  // Keep the camera mounted stable, even while device is resolving
  if (!device) {
    return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
      />

      <Button
        mode="contained"
        onPress={capture}
        disabled={busy}
        style={{ borderRadius: 0 }}
      >
        {busy ? 'Processing…' : 'Capture'}
      </Button>
    </View>
  );
}