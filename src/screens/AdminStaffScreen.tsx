import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  STAFF_ROLE_LABELS,
  STAFF_ROLE_OPTIONS,
} from '../services/staffPermissions';
import {
  createStaffUser,
  fetchStaffAuditEvents,
  fetchStaffUsers,
  sendStaffInvite,
  updateStaffUser,
  type StaffAuditEventRecord,
  type StaffUserRecord,
} from '../services/staffService';
import type { AuthenticatedRequest } from './types';
import { theme, styles } from '../theme';

export interface AdminStaffScreenProps {
  onBack: () => void;
  makeAuthenticatedRequest: AuthenticatedRequest;
}

export function AdminStaffScreen({
  onBack,
  makeAuthenticatedRequest,
}: AdminStaffScreenProps) {
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'audit' | 'invite'>('list');
  const [auditEvents, setAuditEvents] = useState<StaffAuditEventRecord[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUserRecord[]>([]);
  const [selected, setSelected] = useState<StaffUserRecord | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    staff_role: 'operations_admin',
    job_title: '',
    phone_number: '',
    is_active: true,
  });

  const loadStaff = useCallback(async (term?: string) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchStaffUsers(makeAuthenticatedRequest, term);
      setStaffUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff users.');
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const resetCreateForm = () => {
    setForm({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      staff_role: 'operations_admin',
      job_title: '',
      phone_number: '',
      is_active: true,
    });
  };

  const openEdit = (row: StaffUserRecord) => {
    setSelected(row);
    setForm({
      username: row.username,
      email: row.email,
      password: '',
      first_name: row.first_name,
      last_name: row.last_name,
      staff_role: row.staff_role,
      job_title: row.job_title ?? '',
      phone_number: row.phone_number ?? '',
      is_active: row.is_active,
    });
    setMode('edit');
    setError(null);
  };

  const submitCreate = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Username, email, and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createStaffUser(makeAuthenticatedRequest, {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        staff_role: form.staff_role,
        job_title: form.job_title.trim(),
        phone_number: form.phone_number.trim(),
      });
      Alert.alert('Success', 'Staff user created.');
      resetCreateForm();
      setMode('list');
      await loadStaff(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchStaffAuditEvents(makeAuthenticatedRequest);
      setAuditEvents(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log.');
    } finally {
      setLoading(false);
    }
  };

  const submitInvite = async () => {
    if (!form.email.trim()) {
      setError('Email is required for an invite.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendStaffInvite(makeAuthenticatedRequest, {
        email: form.email.trim(),
        staff_role: form.staff_role,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      Alert.alert('Invite sent', `Invitation email sent to ${form.email.trim()}.`);
      setMode('list');
      resetCreateForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed.');
    } finally {
      setLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!selected) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateStaffUser(makeAuthenticatedRequest, selected.id, {
        staff_role: form.staff_role,
        job_title: form.job_title.trim(),
        phone_number: form.phone_number.trim(),
        is_active: form.is_active,
      });
      Alert.alert('Success', 'Staff user updated.');
      setMode('list');
      setSelected(null);
      await loadStaff(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'audit') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Button title="← Back" onPress={() => { setMode('list'); setError(null); }} />
          <Text style={styles.title}>Staff audit log</Text>
          {loading ? <ActivityIndicator size="large" color={theme.primary} /> : null}
          {error ? <Text style={{ color: theme.error, marginVertical: 8 }}>{error}</Text> : null}
          {auditEvents.map((row) => (
            <View key={row.id} style={[styles.itemContainer, { marginBottom: 12 }]}>
              <Text style={styles.itemTitle}>{row.event_type.replace(/_/g, ' ')}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>{row.created_at}</Text>
              <Text style={{ color: theme.text, marginTop: 4 }}>
                {row.actor_username ? `By ${row.actor_username}` : 'By system'}
                {row.target_username ? ` · ${row.target_username}` : ''}
                {row.target_email ? ` · ${row.target_email}` : ''}
              </Text>
              {(row.old_role || row.new_role) ? (
                <Text style={{ color: theme.textMuted, marginTop: 4 }}>
                  {row.old_role ? `${row.old_role} → ` : ''}{row.new_role}
                </Text>
              ) : null}
            </View>
          ))}
          {!loading && auditEvents.length === 0 ? (
            <Text style={{ color: theme.textMuted }}>No audit events yet.</Text>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  if (mode === 'invite') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Button title="← Back" onPress={() => { setMode('list'); setError(null); }} />
          <Text style={styles.title}>Invite staff by email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="First name (optional)"
            value={form.first_name}
            onChangeText={(text) => setForm({ ...form, first_name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Last name (optional)"
            value={form.last_name}
            onChangeText={(text) => setForm({ ...form, last_name: text })}
          />
          <Text style={{ color: theme.text, marginBottom: 8 }}>Role</Text>
          {STAFF_ROLE_OPTIONS.map((opt) => (
            <View key={opt.value} style={styles.buttonContainer}>
              <Button
                title={`${form.staff_role === opt.value ? '✓ ' : ''}${opt.label}`}
                onPress={() => setForm({ ...form, staff_role: opt.value })}
              />
            </View>
          ))}
          {error ? <Text style={{ color: theme.error, marginVertical: 8 }}>{error}</Text> : null}
          <View style={styles.buttonContainer}>
            <Button title={loading ? 'Sending...' : 'Send invite email'} onPress={submitInvite} disabled={loading} />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Button title="← Back" onPress={() => { setMode('list'); setError(null); }} />
          <Text style={styles.title}>{mode === 'create' ? 'Add staff user' : 'Edit staff user'}</Text>
          {mode === 'create' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={form.username}
                onChangeText={(text) => setForm({ ...form, username: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 chars)"
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
            </>
          ) : (
            <View style={[styles.itemContainer, { marginBottom: 12 }]}>
              <Text style={styles.itemTitle}>{form.username}</Text>
              <Text style={{ color: theme.textMuted }}>{form.email}</Text>
            </View>
          )}
          <Text style={{ color: theme.text, marginBottom: 8 }}>Role</Text>
          {STAFF_ROLE_OPTIONS.map((opt) => (
            <View key={opt.value} style={styles.buttonContainer}>
              <Button
                title={`${form.staff_role === opt.value ? '✓ ' : ''}${opt.label}`}
                onPress={() => setForm({ ...form, staff_role: opt.value })}
              />
            </View>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Job title (optional)"
            value={form.job_title}
            onChangeText={(text) => setForm({ ...form, job_title: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            value={form.phone_number}
            onChangeText={(text) => setForm({ ...form, phone_number: text })}
          />
          {mode === 'edit' ? (
            <View style={[styles.itemContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={{ color: theme.text }}>Active</Text>
              <Switch
                value={form.is_active}
                onValueChange={(value) => setForm({ ...form, is_active: value })}
              />
            </View>
          ) : null}
          {error ? <Text style={{ color: theme.error, marginVertical: 8 }}>{error}</Text> : null}
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Saving...' : mode === 'create' ? 'Create staff user' : 'Save changes'}
              onPress={mode === 'create' ? submitCreate : submitEdit}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Button title="← Back" onPress={onBack} />
        <Text style={styles.title}>👥 Manage Staff</Text>
        <TextInput
          style={styles.input}
          placeholder="Search name or email"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.buttonContainer}>
          <Button title="Search" onPress={() => loadStaff(search)} disabled={loading} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="➕ Add staff user" onPress={() => { resetCreateForm(); setMode('create'); }} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="✉️ Invite by email" onPress={() => { resetCreateForm(); setMode('invite'); }} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="📋 Audit log" onPress={() => { setMode('audit'); loadAudit(); }} />
        </View>
        {loading ? <ActivityIndicator size="large" color={theme.primary} /> : null}
        {error ? <Text style={{ color: theme.error, marginVertical: 8 }}>{error}</Text> : null}
        {staffUsers.map((row) => (
          <View key={row.id} style={[styles.itemContainer, { marginBottom: 12 }]}>
            <Text style={styles.itemTitle}>
              {row.first_name} {row.last_name} ({row.username})
            </Text>
            <Text style={{ color: theme.text }}>{row.email}</Text>
            <Text style={{ color: theme.textMuted, marginTop: 4 }}>
              {STAFF_ROLE_LABELS[row.staff_role] ?? row.staff_role}
              {' · '}
              {row.is_active ? 'Active' : 'Inactive'}
            </Text>
            <View style={[styles.buttonContainer, { marginTop: 8 }]}>
              <Button title="Edit role / status" onPress={() => openEdit(row)} />
            </View>
          </View>
        ))}
        {!loading && staffUsers.length === 0 ? (
          <Text style={{ color: theme.textMuted }}>No staff users found.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
