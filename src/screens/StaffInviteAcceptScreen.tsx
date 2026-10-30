import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  acceptStaffInvite,
  validateStaffInvite,
} from '../services/staffService';
import { AUTH_COPY } from '../content/authMicrocopy';
import { STAFF_ROLE_LABELS } from '../services/staffPermissions';
import { theme, styles } from '../theme';

const copy = AUTH_COPY.staffInviteAccept;

export interface StaffInviteAcceptScreenProps {
  apiBase: string;
  token: string;
  onDone: () => void;
}

export function StaffInviteAcceptScreen({
  apiBase,
  token,
  onDone,
}: StaffInviteAcceptScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await validateStaffInvite(apiBase, token);
        if (cancelled) {
          return;
        }
        if (!result.valid) {
          setError('This invite link is not valid.');
          return;
        }
        setEmail(result.email ?? '');
        setStaffRole(result.staff_role ?? '');
        setForm((prev) => ({
          ...prev,
          first_name: result.first_name ?? prev.first_name,
          last_name: result.last_name ?? prev.last_name,
        }));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not validate invite.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, token]);

  const submit = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await acceptStaffInvite(apiBase, {
        token,
        username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      Alert.alert('Account ready', 'You can log in with your new staff account.');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !email) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{copy.header}</Text>
        <Text style={{ color: theme.textMuted, marginBottom: 12 }}>{copy.subtext}</Text>
        {email ? (
          <Text style={{ color: theme.textMuted, marginBottom: 12 }}>
            {email}
            {staffRole ? ` · ${STAFF_ROLE_LABELS[staffRole] ?? staffRole}` : ''}
          </Text>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={copy.usernameLabel}
          value={form.username}
          onChangeText={(text) => setForm({ ...form, username: text })}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={copy.passwordLabel}
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="First name"
          value={form.first_name}
          onChangeText={(text) => setForm({ ...form, first_name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Last name"
          value={form.last_name}
          onChangeText={(text) => setForm({ ...form, last_name: text })}
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
