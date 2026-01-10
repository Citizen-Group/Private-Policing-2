import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const theme = useTheme();

export function HotBadge() {
  return (
    <View
      style={{
        backgroundColor: "#d32f2f",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        justifyContent: 'center',
        margin: 5,
        alignSelf: 'flex-start'
      }}
    >
      <Text variant="labelSmall" style={{ color: theme.colors.onError }}>
        HOT
      </Text>
    </View>
  );
}
