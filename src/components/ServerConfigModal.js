import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { BACKEND_ENDPOINTS, getActiveBaseUrl, setActiveBaseUrl, getActiveRestaurantId, setActiveRestaurantId } from '../services/api';

export function ServerConfigModal({ visible, onClose, onSaved }) {
  const [currentUrl, setCurrentUrl] = useState(getActiveBaseUrl());
  const [restaurantId, setRestaurantId] = useState(String(getActiveRestaurantId()));

  const handleSelectPreset = (url) => {
    setCurrentUrl(url);
  };

  const handleSave = () => {
    setActiveBaseUrl(currentUrl);
    setActiveRestaurantId(parseInt(restaurantId, 10) || 1);
    Alert.alert('Saved', 'Backend endpoint updated successfully!');
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Backend Connection</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Select Preset Endpoint</Text>
          <View style={styles.presets}>
            {BACKEND_ENDPOINTS.map((item, idx) => {
              const isSelected = currentUrl === item.url;
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.presetItem, isSelected && styles.presetItemActive]}
                  onPress={() => handleSelectPreset(item.url)}
                >
                  <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>{item.label}</Text>
                  <Text style={styles.presetUrl}>{item.url}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Custom Backend URL</Text>
          <TextInput 
            style={styles.input}
            value={currentUrl}
            onChangeText={setCurrentUrl}
            placeholder="http://192.168.1.X:8001"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.sectionLabel}>Restaurant ID</Text>
          <TextInput 
            style={styles.input}
            value={restaurantId}
            onChangeText={setRestaurantId}
            placeholder="1"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Connect & Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  presets: {
    gap: 6,
  },
  presetItem: {
    backgroundColor: COLORS.bgSecondary,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  presetItemActive: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(252, 128, 25, 0.1)',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  presetTextActive: {
    color: COLORS.brand,
  },
  presetUrl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    color: '#FFF',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
