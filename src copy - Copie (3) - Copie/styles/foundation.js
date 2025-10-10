// src/styles/foundation.js
import {Colors, Typography, Spacings} from 'react-native-ui-lib';

Colors.loadColors({
  primaryColor: '#1CB5E0',
  secondaryColor: '#000046',
  textColor: '#171923',
  cardColor: '#FFF',
  bgColor: '#f7f8fa',
  dangerColor: '#F87171',
  successColor: '#22C55E',
});

Typography.loadTypographies({
  h1: {fontSize: 32, fontWeight: '700'},
  h2: {fontSize: 24, fontWeight: '600'},
  body: {fontSize: 16, fontWeight: '400'},
});

Spacings.loadSpacings({
  page: 20,
  card: 14,
  gridGutter: 16,
});
