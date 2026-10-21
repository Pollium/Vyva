import { createContext, useContext } from 'react';
import en, { type Messages } from './en';

export const MessagesContext = createContext<Messages>(en);

export const useMessages = (): Messages => useContext(MessagesContext);
