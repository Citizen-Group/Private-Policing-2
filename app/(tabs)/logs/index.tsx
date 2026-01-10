import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, FlatList, Modal, Pressable, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import {
  getAllPlates,
  deletePlate,
  updatePlate,
} from '@/libraries/citizen/db/database';

import { PlateRecord } from "@/libraries/citizen/types";
import { HotBadge } from "@/libraries/citizen/components/hot-badge";
import { maybeFetchHotDetails  } from '@/libraries/citizen/hotsheet/details';

export default function LogScreen() {
  const [records, setRecords] = useState<PlateRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadRecords() {
    const rows = await getAllPlates();
    setRecords(rows as PlateRecord[]);
  }

  // Refresh when screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  // Pull‑down refresh handler
  async function onRefresh() {
    setRefreshing(true);

    // Re-hydrate hot sheet for all plates
    for (const record of records) {
      await maybeFetchHotDetails(record.plateText);
    }

    await loadRecords();
    setRefreshing(false);
  }

  async function handleDelete(id: number) {
    await deletePlate(id);
    loadRecords();
  }

  async function handleEdit(record: PlateRecord) {
    router.push({
      pathname: '/(tabs)/actions/manual/details',
      params: {
        id: record.id.toString(),
        fullImage: record.fullImage,
        plateImage: record.plateImage,
        text: record.plateText,
        type: record.type,
        editing: 'true',
      },
    });
  }

  async function mockPost(record: PlateRecord): Promise<void> {
    await new Promise(res => setTimeout(res, 500));
    throw new Error('Mock failure');
  }

  async function handleSend(record: PlateRecord) {
    try {
      await mockPost(record);
      await updatePlate(record.id, { sent: 1, sendError: 0 });
    } catch {
      await updatePlate(record.id, { sent: 0, sendError: 1 });
    }

    loadRecords();
  }

  async function retryAllFailed() {
    const failed = records.filter(
      r => r.sent === 0 && r.sendError === 1
    );

    for (const record of failed) {
      try {
        await mockPost(record);
        await updatePlate(record.id, { sent: 1, sendError: 0 });
      } catch {
        await updatePlate(record.id, { sent: 0, sendError: 1 });
      }
    }

    loadRecords();
  }

  function openImageModal(uri: string) {
    setModalImage(uri);
    setModalVisible(true);
  }

  // Fade‑in row wrapper
  function FadeInView({ children }: { children: React.ReactNode }) {
    const fade = new Animated.Value(0);

    useEffect(() => {
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }, []);

    return <Animated.View style={{ opacity: fade }}>{children}</Animated.View>;
  }

  function renderItem({ item }: { item: PlateRecord }) {
    const date = new Date(item.createdAt);

    return (
      <FadeInView>
        <View
          style={{
            flexDirection: 'row',
            padding: 12,
            marginBottom: 12,
            borderRadius: 8,
            backgroundColor: 'white',
            elevation: 2,
          }}
        >
          <View style={{ flex: 1 }}>

          <Pressable onPress={() => openImageModal(item.fullImage)}>
            <Image
              source={{ uri: item.plateImage }}
              style={{
                width: 70,
                height: 40,
                borderRadius: 4,
                marginRight: 12,
              }}
              resizeMode="cover"
            />
          </Pressable>
          {item.isHot === 1 && <HotBadge />}
          </View>
          

          <View style={{ flex: 1 }}>
            <Text variant="titleMedium">{item.plateText}</Text>
            <Text variant="bodySmall" style={{ color: '#666' }}>
              {item.type.toUpperCase()}
            </Text>

            <Text variant="bodySmall" style={{ color: '#666' }}>
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </Text>
          </View>

          <View style={{ justifyContent: 'center', marginRight: 8 }}>
            {item.sent === 1 && <Text style={{ color: 'green' }}>✓</Text>}
            {item.sent === 0 && item.sendError === 1 && (
              <Text style={{ color: 'red' }}>⚠</Text>
            )}
            {item.sent === 0 && item.sendError === 0 && (
              <Text style={{ color: '#999' }}>⏳</Text>
            )}
          </View>

          <View style={{ justifyContent: 'space-between' }}>
            <Button compact onPress={() => handleEdit(item)}>
              Edit
            </Button>

            <Button compact onPress={() => handleSend(item)}>
              {item.sent === 1 ? 'Resend' : 'Send'}
            </Button>

            <Button compact onPress={() => handleDelete(item.id)}>
              Delete
            </Button>
          </View>
        </View>
      </FadeInView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Button
        mode="contained"
        onPress={retryAllFailed}
        style={{ margin: 16 }}
      >
        Retry All Failed
      </Button>

      <FlatList
        data={records}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setModalVisible(false)}
        >
          {modalImage && (
            <Image
              source={{ uri: modalImage }}
              style={{
                width: '90%',
                height: '70%',
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}