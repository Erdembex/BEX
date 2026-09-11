import React from 'react';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useBusinessMenu } from '@/components/business/BusinessMenuProvider';

type Props = {
  title: string;
  showNotifications?: boolean;
};

/** İşletme ekranları — sol üst hamburger ile yan menü. */
export function BusinessScreenHeader({ title, showNotifications = true }: Props) {
  const { openMenu } = useBusinessMenu();
  return (
    <AppHeader
      title={title}
      showMenu
      showNotifications={showNotifications}
      onMenuPress={openMenu}
    />
  );
}
