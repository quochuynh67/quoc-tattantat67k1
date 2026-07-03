import { createTheme } from '@mui/material/styles';

// Define primary & secondary colors based on brand guidelines
const primaryColor = '#00695c'; // teal
const secondaryColor = '#c5a880'; // rice gold

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
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `'Be Vietnam Pro', 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: { fontSize: '2.5rem', fontWeight: 700, color: primaryColor },
    h2: { fontSize: '2rem', fontWeight: 600, color: primaryColor },
    body1: { fontSize: '1rem', color: '#333' },
    button: { textTransform: 'none' },
  },
  spacing: 8, // 8px grid spacing
  components: {
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
