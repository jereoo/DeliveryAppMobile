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
  const [assignedUsername, setAssignedUsername] = useState('');
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [form, setForm] = useState({
    password: '',
    confirm_password: '',
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
        setAssignedUsername(result.username ?? '');
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
    if (!assignedUsername.trim()) {
      setError('This invite is missing an assigned username. Contact your administrator.');
      return;
    }
    if (!form.password.trim() || !form.confirm_password.trim()) {
      setError('Password and confirmation are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await acceptStaffInvite(apiBase, {
        token,
        password: form.password,
        confirm_password: form.confirm_password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      Alert.alert(
        'Account ready',
        `You can log in as ${assignedUsername} with the password you just set.`,
      );
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !email && !error) {
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
        {assignedUsername ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: theme.textMuted, marginBottom: 4 }}>{copy.usernameLabel}</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>
              {assignedUsername}
            </Text>
          </View>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={copy.passwordLabel}
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder={copy.confirmPasswordLabel}
          value={form.confirm_password}
          onChangeText={(text) => setForm({ ...form, confirm_password: text })}
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
