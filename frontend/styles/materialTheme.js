import { createTheme } from '@mui/material/styles';
import appConfig from '@/config/appConfig';
import { getMuiThemeColors } from '@/utils/themeUtils';

const muiColors = getMuiThemeColors();
const colors = appConfig.theme.colors;

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: muiColors.primary,
    secondary: muiColors.secondary,
    error: muiColors.error,
    warning: muiColors.warning,
    success: muiColors.success,
    info: muiColors.info,
    grey: {
      50: colors.secondary[50],
      100: colors.secondary[100],
      200: colors.secondary[200],
      300: colors.secondary[300],
      400: colors.secondary[400],
      500: colors.secondary[500],
      600: colors.secondary[600],
      700: colors.secondary[700],
      800: colors.secondary[800],
      900: colors.secondary[900],
    },
    background: {
      paper: colors.background.paper,
    },
    text: {
      primary: colors.secondary[900],
      secondary: colors.secondary[600],
    },
  },
  typography: {
    fontFamily: appConfig.theme.typography.fontFamily,
    h1: {
      fontSize: 'clamp(2.4rem, -0.64rem + 17.97vw, 14.31rem)',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 'clamp(1.89rem, 0.3rem + 7.94vw, 5.96rem)',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 'clamp(1.66rem, 0.82rem + 4.2vw, 3.82rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: 'clamp(1.46rem, 1.07rem + 1.92vw, 2.44rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 'clamp(1.28rem, 1.17rem + 0.55vw, 1.56rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 'clamp(1.13rem, 1.17rem + -0.24vw, 1rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: appConfig.theme.borderRadius.small,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: appConfig.theme.borderRadius.small,
          padding: '8px 16px',
          textTransform: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: appConfig.theme.borderRadius.medium,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: appConfig.theme.borderRadius.medium,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: appConfig.theme.borderRadius.small,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: appConfig.theme.borderRadius.small,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: appConfig.theme.borderRadius.medium,
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary[400],
      light: colors.primary[300],
      dark: colors.primary[600],
      contrastText: '#fff',
    },
    secondary: {
      main: colors.secondary[400],
      light: colors.secondary[300],
      dark: colors.secondary[500],
      contrastText: '#fff',
    },
    background: {
      default: colors.secondary[900],
      paper: colors.secondary[800],
    },
    text: {
      primary: colors.secondary[50],
      secondary: colors.secondary[300],
    },
  },
}); 