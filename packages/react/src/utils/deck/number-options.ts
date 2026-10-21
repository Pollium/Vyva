import type { SelectOption } from '../../components/ui/SelectInput';

export const numberOptions = (values: readonly number[], current: number, label: (value: number) => string): SelectOption<string>[] =>
    [...new Set([current, ...values])].sort((a, b) => a - b).map((value) => ({ value: String(value), label: label(value) }));
