import { AppBar, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { layout } from '../../theme/tokens';

export function TopBar() {
  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar variant="dense" sx={{ minHeight: layout.topBarHeight, px: 2 }}>
        <Typography
          variant="subtitle1"
          noWrap
          component={RouterLink}
          to="/home"
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 600,
            letterSpacing: '0.06em',
            '&:hover': { opacity: 0.88 },
          }}
        >
          AIRA
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
