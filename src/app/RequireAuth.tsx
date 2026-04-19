import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { getFirebase, isFirebaseConfigured } from '../services/firebase';
import { seedDomainsIfMissing } from '../services/seed/seedDomains';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    if (!isFirebaseConfigured()) return;
    const { db } = getFirebase();
    void (async () => {
      try {
        await seedDomainsIfMissing(db);
      } catch (err) {
        // Seeding hits Firestore rules; if rules are not deployed (or deny this client), do not break the app shell.
        console.warn(
          '[AIRA] Skipping Domain seed: Firestore rejected the request. Deploy `firestore.rules` to this project, ' +
            'or run against the emulator with rules loaded. Until then, create `Domain/ai` and `Domain/who` manually or run `npm run seed:firestore`.',
          err,
        );
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
