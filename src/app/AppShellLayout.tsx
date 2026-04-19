import { Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

export function AppShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
