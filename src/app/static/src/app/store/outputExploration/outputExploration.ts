import {TranslatableState} from "../../types";
import {Language} from "../translations/locales";

export interface OutputExplorationState extends TranslatableState {
    test: string
}

export const initialOutputExplorationState = (): OutputExplorationState => {
    return {
        test: "",
        language: Language.en,
        updatingLanguage: false,
    }
}