const tailwindColors = require('tailwindcss/colors')
const tailwindTypography = require('@tailwindcss/typography')

module.exports = {
  content: [
    'index.html',
    'src/**/*.{svelte,ts,css}',
    '../../node_modules/@podman-desktop/ui-svelte/dist/**/*.{svelte,ts,css}',
  ],
  darkMode: 'class',
  theme: {
    fontSize: {
      'xs': '10px',
      'sm': '11px',
      'base': '12px',
      'lg': '14px',
      'xl': '16px',
      '2xl': '18px',
      '3xl': '20px',
      '4xl': '24px',
      '5xl': '30px',
      '6xl': '36px',
    },
    extend: {
      boxShadow: {
        "titlebar": 'inset 0px -1px 0px 0 rgb(54 54 61 / 0.6)', // highlight for bottom of titlebar
	"pageheader": 'inset 0 0px 10px 0 rgb(0 0 0 / 0.4)',
	"nav": 'inset 7px -4px 6px 0 rgb(0 0 0 / 0.15)',
      },
      transitionProperty: {
        width: 'width',
      },
      width: {
        'leftnavbar': '54px',
        'leftsidebar': '225px',
      },
      minWidth: {
        'leftnavbar': '54px',
        'leftsidebar': '225px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: 'var(--pd-details-body-text)',
            '--tw-prose-body': 'var(--pd-details-body-text)',
            '--tw-prose-bold': 'var(--pd-details-body-text)',
            '--tw-prose-headings': 'var(--pd-details-body-text)',
            '--tw-prose-quotes': 'var(--pd-details-body-text)',
            '--tw-prose-hr': 'var(--pd-details-body-text)',
            '--tw-prose-links': 'var(--pd-link)',
            '--tw-prose-code': 'var(--pd-details-body-text)',
          },
        },
      }),
    },
    colors: {
      'charcoal': {
        600: '#27272a',
        800: '#18181b',
      },
      'gray': {
        400: '#d1d1d1',
        700: '#aaabac',
        900: '#818181',
      },
      'purple': {
        400: '#ad8bfa',
        500: '#8b5cf6',
      },
      'sky': {
        400: '#51a2da',
      },
      'green': {
        600: '#2b7037',
      },
      'red': {
        600: '#e5421d',
      },
      'amber': {
        600: tailwindColors.amber[600],
      },
      transparent: 'transparent',
      black: '#000',
      white: '#fff',
      // The remaining colors below are not part of our palette and are only here
      // to maintain existing code. No new use.
      'violet': {
        500: tailwindColors.violet[500],
        600: tailwindColors.violet[600],
      },
    },
  },
  plugins: [
    tailwindTypography
  ],
};
