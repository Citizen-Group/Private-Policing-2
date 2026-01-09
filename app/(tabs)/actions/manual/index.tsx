import { View, Button, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useRef, useState, useCallback } from 'react';
import { router } from 'expo-router';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';
import cropImage from '@/libraries/citizen/crop-helper';

export default function CameraScreen() {
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const [busy, setBusy] = useState(false);

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

      // Take photo
      const photo = await cam.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      const fullImagePath = `file://${photo.path}`;

      // OCR on full image
      const result = await TextRecognition.recognize(fullImagePath);
      const candidate = findPlateCandidate(result.blocks);

      if (candidate && candidate.frame) {
        let { left, top, width, height } = candidate.frame;

        // No rotation transform here — ML Kit + VisionCamera mismatch is tricky.
        // We assume ML Kit frame is already in the same orientation as the saved image
        // based on your latest working tests.

        const correctedFrame = { left, top, width, height };

        // Crop image
        const croppedPath = await cropImage(fullImagePath, correctedFrame);

        // OCR cropped region
        const croppedOCR = await TextRecognition.recognize(croppedPath);
        console.log(croppedOCR)

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

      <Button title={busy ? 'Processing…' : 'Capture'} onPress={capture} disabled={busy} />
    </View>
  );
}