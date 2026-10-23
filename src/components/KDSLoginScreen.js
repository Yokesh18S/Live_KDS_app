import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { kdsApi } from '../services/api';
import { saveAuthSession } from '../services/storage';

export function KDSLoginScreen({ onLoginSuccess, onOpenServerConfig }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HOTEL_ADMIN');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await kdsApi.login(email.trim(), password.trim(), role);
      if (data?.access_token) {
        await saveAuthSession(data.access_token, data.user || { email, role });
        onLoginSuccess(data.user || { email, role });
      } else {
        setErrorMsg('Login succeeded but no token was returned.');
      }
    } catch (err) {
      console.warn('[KDS Login] Error:', err.message);
      setErrorMsg(err.message || 'Invalid credentials or server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="chef-hat" size={32} color="#FFF" />
          </View>
          <Text style={styles.title}>Live KDS Kitchen</Text>
          <Text style={styles.subtitle}>Kitchen Display System • Staff Sign In</Text>
        </View>

        {/* Error Alert */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.critical} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Role Segmented Tabs */}
        <View style={styles.roleTabs}>
          {['HOTEL_ADMIN', 'CASHIER', 'SUPER_ADMIN'].map((r) => {
            const isSelected = role === r;
            const label = r === 'HOTEL_ADMIN' ? 'Manager' : r === 'CASHIER' ? 'Cashier' : 'Admin';
            return (
              <TouchableOpacity
                key={r}
                style={[styles.roleTab, isSelected && styles.roleTabActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleTabText, isSelected && styles.roleTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Staff Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="manager@udipi.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={18} 
                color={COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitText}>Connect to Live Kitchen</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Server Config Button */}
        <TouchableOpacity style={styles.serverLink} onPress={onOpenServerConfig}>
          <Ionicons name="server-outline" size={14} color={COLORS.brand} />
          <Text style={styles.serverLinkText}>Configure Backend Server IP / Port</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.critical,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    flex: 1,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleTabActive: {
    backgroundColor: COLORS.brand,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: COLORS.brand,
    height: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  serverLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    padding: 6,
  },
  serverLinkText: {
    color: COLORS.brand,
    fontSize: 12,
    fontWeight: '700',
  },
});
