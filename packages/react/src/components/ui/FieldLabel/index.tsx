import { Label } from 'react-aria-components';
import type { ReactNode } from 'react';

interface FieldLabelProps{
    isHidden?: boolean;
    children: ReactNode;
}

const FieldLabel = ({ isHidden = false, children }: FieldLabelProps) => (
    <Label className={isHidden ? 'vy:sr-only' : 'vy:text-[0.8125rem] vy:font-medium vy:text-foreground'}>{children}</Label>
);

export default FieldLabel;
