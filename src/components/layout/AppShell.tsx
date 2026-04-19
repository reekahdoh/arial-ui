import { Box, Button } from '@mui/material';
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { layout } from '../../theme/tokens';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <TopBar />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              flex: 1,
              px: layout.contentPaddingX,
              py: layout.contentPaddingY,
              maxWidth: layout.contentMaxWidth,
              mx: 'auto',
              width: '100%',
            }}
          >
            {children}
          </Box>
          <Box
            sx={{
              px: layout.contentPaddingX,
              pb: 2,
              pt: 1,
              maxWidth: layout.contentMaxWidth,
              mx: 'auto',
              width: '100%',
              flexShrink: 0,
            }}
          >
            <Button
              variant="text"
              color="inherit"
              onClick={() => void signOut().then(() => navigate('/', { replace: true }))}
              sx={{ color: 'text.secondary', fontWeight: 600, px: 0 }}
            >
              Sign out
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
