import React from 'react';
import { Href } from 'expo-router';
import { MessagesInboxView } from '@/components/messaging/MessagesInboxView';
import { useBusinessMenu } from '@/components/business/BusinessMenuProvider';

export default function BusinessMessagesInboxScreen() {
  const { openMenu } = useBusinessMenu();

  return (
    <MessagesInboxView
      audience="business"
      showMenu
      onMenuPress={openMenu}
      chatRoute={(applicationId) => `/(business)/messages/${applicationId}` as Href}
    />
  );
}
