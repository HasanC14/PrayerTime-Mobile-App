import {createContext, type RefObject} from "react";
import type {Text} from "react-native";
export const SheetFocusContext = createContext<RefObject<Text | null> | null>(null);
