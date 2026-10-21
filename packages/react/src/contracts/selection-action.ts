export const SELECTION_ACTIONS = ['improve', 'shorten', 'simplify'] as const;

export type SelectionAction = typeof SELECTION_ACTIONS[number] | 'ask';
