import { createTheme } from '@mui/material/styles';
import { amber, grey } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: amber[700],
      light: amber[50]
    },
    secondary: {
      main: grey[800],
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
        },
      }
    }
  }
});

export default theme
