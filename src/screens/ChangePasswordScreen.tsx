import React, { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { AUTH_COPY } from '../content/authMicrocopy';
import { changePassword } from '../services/passwordAuthService';
import type { AuthenticatedRequest } from './types';
import { theme, styles } from '../theme';

const copy = AUTH_COPY.changePassword;

export interface ChangePasswordScreenProps {
  onBack: () => void;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

export function ChangePasswordScreen({
  onBack,
  makeAuthenticatedRequest,
}: ChangePasswordScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await changePassword(makeAuthenticatedRequest, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Success', copy.success);
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Button title="← Back" onPress={onBack} />
        <Text style={styles.title}>{copy.header}</Text>
        <Text style={{ color: theme.textMuted, marginBottom: 16 }}>{copy.subtext}</Text>
        <TextInput
          style={styles.input}
          placeholder={copy.currentLabel}
          placeholderTextColor={theme.placeholder}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={copy.newLabel}
          placeholderTextColor={theme.placeholder}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={copy.confirmLabel}
          placeholderTextColor={theme.placeholder}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {error ? <Text style={{ color: theme.error, marginVertical: 8 }}>{error}</Text> : null}
        <View style={styles.buttonContainer}>
          <Button title={loading ? 'Saving...' : copy.cta} onPress={submit} disabled={loading} />
        </View>
      </View>
    </ScrollView>
  );
}
