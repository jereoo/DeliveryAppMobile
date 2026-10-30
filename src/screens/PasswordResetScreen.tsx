import React, { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { AUTH_COPY } from '../content/authMicrocopy';
import { resetPasswordWithToken } from '../services/passwordAuthService';
import { theme, styles } from '../theme';

const copy = AUTH_COPY.resetPassword;

export interface PasswordResetScreenProps {
  token: string;
  onDone: () => void;
}

export function PasswordResetScreen({ token, onDone }: PasswordResetScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordWithToken({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Password updated', 'You can sign in with your new password.');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{copy.header}</Text>
        <Text style={{ color: theme.textMuted, marginBottom: 16 }}>{copy.subtext}</Text>
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
        <View style={styles.buttonContainer}>
          <Button title="Back to login" onPress={onDone} />
        </View>
      </View>
    </ScrollView>
  );
}
