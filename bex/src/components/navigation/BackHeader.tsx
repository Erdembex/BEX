import React from 'react';
import { router } from 'expo-router';
import { AppHeader } from '@/components/navigation/AppHeader';

interface BackHeaderProps {
  title: string;
  showNotifications?: boolean;
}

/** Geri ok + başlık — AppHeader ile tutarlı. */
export function BackHeader({ title, showNotifications = false }: BackHeaderProps) {
  return (
    <AppHeader
      title={title}
      showMenu={false}
      showNotifications={showNotifications}
      onBack={() => router.back()}
    />
  );
}
