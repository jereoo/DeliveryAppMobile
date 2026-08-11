import React from 'react';
import { Text, TextInput, View } from 'react-native';

type Theme = {
  text: string;
  placeholder: string;
};

type Styles = {
  label: object;
  input: object;
};

interface AdminListSearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: Theme;
  styles: Styles;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  keyboardType?: 'default' | 'number-pad';
}

export function AdminListSearchField({
  label,
  placeholder,
  value,
  onChangeText,
  theme,
  styles,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: AdminListSearchFieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholder}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        clearButtonMode="while-editing"
      />
    </View>
  );
}
