import type { Module } from "vuex";
import { actions } from "./actions";
import { mutations } from "./mutations";
import type { HintrVersionResponse } from "../../generated";
import type {RootState} from "../../root";

export interface HintrVersionState {
    hintrVersion: HintrVersionResponse
}

export const initialHintrVersionState = (): HintrVersionState => {
    return {
        hintrVersion: { hintr: "unknown", naomi: "unknown", rrq: "unknown", traduire: "unknown" }
    }
};

const namespaced = true;

export const hintrVersion = (existingState: Partial<RootState> | null): Module<HintrVersionState, RootState> => {
    return  {
        namespaced,
        state: { ...initialHintrVersionState(), ...existingState && existingState.hintrVersion },
        actions,
        mutations
    };
};
