import React, { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { AUTH_COPY } from '../content/authMicrocopy';
import { requestPasswordReset } from '../services/passwordAuthService';
import { theme, styles } from '../theme';

const copy = AUTH_COPY.forgotPassword;

export interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      Alert.alert('Check your email', copy.success);
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
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
          placeholder={copy.emailLabel}
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={{ color: theme.error, marginVertical: 8 }}>{error}</Text> : null}
        <View style={styles.buttonContainer}>
          <Button title={loading ? 'Sending...' : copy.cta} onPress={submit} disabled={loading} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Back to login" onPress={onBack} />
        </View>
      </View>
    </ScrollView>
  );
}
