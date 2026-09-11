import React from 'react';
import { Href } from 'expo-router';
import { MessagesInboxView } from '@/components/messaging/MessagesInboxView';

export default function UserMessagesInboxScreen() {
  return (
    <MessagesInboxView
      audience="user"
      chatRoute={(applicationId) => `/(tabs)/messages/${applicationId}` as Href}
      showMenu
    />
  );
}
