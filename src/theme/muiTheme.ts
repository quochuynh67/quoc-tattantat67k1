import { createTheme } from '@mui/material/styles';

// Define primary & secondary colors based on brand guidelines
const primaryColor = '#176b4d';
const secondaryColor = '#d99a27';

const muiTheme = createTheme({
  palette: {
    mode: 'light', // default; will be toggled by useTheme hook
    primary: { main: primaryColor },
    secondary: { main: secondaryColor },
    background: {
      default: '#FAF8F3',
      paper: '#FFFFFF',
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: `'Be Vietnam Pro', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: { fontSize: 'clamp(2.25rem, 5vw, 4.5rem)', fontWeight: 800, color: primaryColor, letterSpacing: '-0.035em' },
    h2: { fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', fontWeight: 750, color: primaryColor, letterSpacing: '-0.025em' },
    body1: { fontSize: '1rem', color: '#333' },
    button: { textTransform: 'none' },
  },
  spacing: 8, // 8px grid spacing
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 42, paddingInline: 18 } },
    },
    MuiCard: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'linear-gradient(135deg, #176b4d, #0f5840)' } },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          maxWidth: '100%',
        },
        label: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
    },
  },
});

export default muiTheme;
