import React from 'react';
import { Href } from 'expo-router';
import { MessagesInboxView } from '@/components/messaging/MessagesInboxView';
import { userHubBackHeaderProps } from '@/lib/userHubNavigation';

export default function UserMessagesInboxScreen() {
  const hubBack = userHubBackHeaderProps();
  return (
    <MessagesInboxView
      audience="user"
      chatRoute={(applicationId) => `/(tabs)/messages/${applicationId}` as Href}
      showMenu={false}
      onBack={hubBack.onBack}
    />
  );
}
