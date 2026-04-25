import React from 'react';
import type { ButtonProps } from '@mui/material/Button';
import * as S from './style';

export const Button: React.FC<ButtonProps> = (props) => <S.Button {...props} />;
