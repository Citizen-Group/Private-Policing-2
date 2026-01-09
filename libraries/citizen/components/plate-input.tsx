import React, { useRef, useState } from 'react';
import {
  Image,
  View,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text } from 'react-native-paper';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlateInputProps = {
  value: string;
  onChange: (text: string) => void;
  plateImage?: string;
  maxLength?: number; // raw chars (excluding space)
};

function correctOCR(raw: string) {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').split('');

  const corrected = chars.map((c, i) => {
    const prev = chars[i - 1];
    const next = chars[i + 1];

    const isLetterContext =
      (prev && /[A-Z]/.test(prev)) || (next && /[A-Z]/.test(next));
    const isDigitContext =
      (prev && /[0-9]/.test(prev)) || (next && /[0-9]/.test(next));

    if (c === '0' && isLetterContext) return 'O';
    if (c === 'O' && isDigitContext) return '0';

    if (['1', 'I', 'L'].includes(c)) {
      if (isDigitContext) return '1';
      if (isLetterContext) return 'I';
    }

    if (c === '8' && isLetterContext) return 'B';
    if (c === 'B' && isDigitContext) return '8';

    if (c === '5' && isLetterContext) return 'S';
    if (c === 'S' && isDigitContext) return '5';

    if (c === '2' && isLetterContext) return 'Z';
    if (c === 'Z' && isDigitContext) return '2';

    return c;
  });

  return corrected.join('');
}

function detectPattern(raw: string) {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const pattern = cleaned
    .split('')
    .map(c => (/[A-Z]/.test(c) ? 'L' : 'D'))
    .join('');
  return { cleaned, pattern };
}

function autoFormatPlate(raw: string, maxLength: number) {
  const corrected = correctOCR(raw);
  const { cleaned, pattern } = detectPattern(corrected);

  let trimmed = cleaned.slice(0, maxLength);

  if (trimmed.length > 3) {
    if (['LLLDDD', 'DDDLLL'].includes(pattern)) {
      trimmed = trimmed.slice(0, 3) + ' ' + trimmed.slice(3);
    } else if (['LLLLDDD', 'DLLLDDD'].includes(pattern)) {
      trimmed = trimmed.slice(0, 4) + ' ' + trimmed.slice(4);
    }
  }

  return trimmed;
}

function scorePlate(raw: string) {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '');
  const pattern = cleaned
    .split('')
    .map(c => (/[A-Z]/.test(c) ? 'L' : 'D'))
    .join('');

  let score = 0;

  if (cleaned.length >= 6 && cleaned.length <= 8) score += 30;

  const commonPatterns = ['LLLDDD', 'DDDLLL', 'LLLLDDD', 'DLLLDDD'];
  if (commonPatterns.includes(pattern)) score += 40;

  if (/L+D+L+/.test(pattern)) score += 20;

  if (/LLLLL/.test(pattern) || /DDDDD/.test(pattern)) score -= 20;

  if (/[^LD]/.test(pattern)) score -= 50;

  return Math.max(0, Math.min(100, score));
}

export function PlateInput({ value, onChange, plateImage, maxLength = 8 }: PlateInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [cursorIndex, setCursorIndex] = useState(
    value.replace(/[^A-Za-z0-9]/g, '').length
  );
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const handleChange = (t: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const formatted = autoFormatPlate(t, maxLength);
    const raw = formatted.replace(/[^A-Za-z0-9]/g, '');
    const score = scorePlate(formatted);

    setConfidence(score);

    if (score < 40) {
      setError('Plate looks unusual');
    } else if (raw.length < 2) {
      setError('Plate too short');
    } else {
      setError(null);
    }

    onChange(formatted);
    setCursorIndex(raw.length);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const raw = value.replace(/[^A-Za-z0-9]/g, '');
      const newRaw = raw.slice(0, -1);
      const formatted = autoFormatPlate(newRaw, maxLength);

      onChange(formatted);
      setCursorIndex(newRaw.length);
    }
  };

  const rawChars = value.replace(/[^A-Za-z0-9]/g, '').split('');
  const boxes = Array.from({ length: maxLength });

  return (
    <View style={{ marginVertical: 20 }}>
      {plateImage && (
        <Image
          source={{ uri: plateImage }}
          style={{
            width: 160,
            height: 80,
            alignSelf: 'center',
            marginBottom: 12,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#ccc'
          }}
          resizeMode="contain"
        />
      )}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {boxes.map((_, i) => {
          const char = rawChars[i] ?? '';
          const isFocused = cursorIndex === i;

          return (
            <View
              key={i}
              style={{
                width: 40,
                height: 55,
                borderWidth: 2,
                borderColor: error
                  ? '#d32f2f'
                  : isFocused
                  ? '#6200ee'
                  : '#ccc',
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
              }}
            >
              <Text style={{ fontSize: 28 }}>{char}</Text>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          onKeyPress={handleKeyPress}
          maxLength={maxLength + 1}
          autoFocus={false}
          style={{
            position: 'absolute',
            opacity: 0,
            height: 0,
            width: 0,
          }}
          keyboardType="default"
        />
      </TouchableOpacity>

      {error && (
        <Text style={{ color: '#d32f2f', marginTop: 8, fontSize: 14 }}>
          {error}
        </Text>
      )}

      {confidence !== null && !error && (
        <Text style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
          Confidence: {confidence}%
        </Text>
      )}
    </View>
  );
}