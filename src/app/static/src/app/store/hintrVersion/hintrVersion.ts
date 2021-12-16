import { Module } from "vuex";
import { actions } from "./actions";
import { mutations } from "./mutations";
import { HintrVersionResponse } from "../../generated";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface HintrVersionState {
    hintrVersion: HintrVersionResponse
}

export const initialHintrVersionState = (): HintrVersionState => {
    return {
        hintrVersion: { hintr: "unknown", naomi: "unknown", rrq: "unknown", traduire: "unknown" }
    }
};

const namespaced = true;

export const hintrVersion = (existingState: Partial<DataExplorationState> | null): Module<HintrVersionState, DataExplorationState> => {
    return  {
        namespaced,
        state: { ...initialHintrVersionState(), ...existingState && existingState.hintrVersion },
        actions,
        mutations
    };
};
