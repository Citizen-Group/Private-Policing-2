import { Stack } from "expo-router";
import { useEffect } from 'react';
import { initDatabase, refreshHotSheetAsync } from '@/libraries/citizen/db/database';

// init DB on first page load
useEffect(() => {
  initDatabase();
  refreshHotSheetAsync(); // non blocking
}, []);

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
