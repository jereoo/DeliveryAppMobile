import React from 'react';
import { Button, Text, View } from 'react-native';

interface AdminFilteredListMetaProps {
  totalCount: number;
  filteredCount: number;
  filteredEmptyMessage: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  theme: { textMuted: string };
  styles: { emptyText: object };
  children: React.ReactNode;
}

export function AdminFilteredListMeta({
  totalCount,
  filteredCount,
  filteredEmptyMessage,
  hasActiveFilters,
  onClearFilters,
  theme,
  styles,
  children,
}: AdminFilteredListMetaProps) {
  if (totalCount === 0) {
    return null;
  }

  if (filteredCount === 0) {
    return (
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Text style={styles.emptyText}>{filteredEmptyMessage}</Text>
        {hasActiveFilters ? (
          <View style={{ marginTop: 8 }}>
            <Button title="Clear filters" onPress={onClearFilters} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <Text style={{ color: theme.textMuted, marginBottom: 8 }}>
        Showing {filteredCount} of {totalCount}
      </Text>
      {children}
    </>
  );
}
