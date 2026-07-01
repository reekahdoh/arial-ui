import { AppBar, Box, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { layout } from '../../theme/tokens';

export function TopBar() {
  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense" sx={{ minHeight: layout.topBarHeight, px: 2 }}>
        <Box
          component={RouterLink}
          to="/home"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover': { opacity: 0.88 },
          }}
        >
          <Box
            component="img"
            src="/arial-blue-192.png"
            alt="AIRA"
            sx={{ height: 64, width: 'auto', display: 'block' }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
