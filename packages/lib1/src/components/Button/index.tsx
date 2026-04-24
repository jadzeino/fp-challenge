import React from 'react';
import { AutoAwesome } from '@mui/icons-material';
import { ButtonProps } from '@mui/material/Button';
import * as S from './style';

export const Button: React.FC<ButtonProps> = ({ ...props }) => (
  <S.Button {...props} autoFocus onClick={() => undefined}>
    <AutoAwesome /> {props.children}
  </S.Button>
);
