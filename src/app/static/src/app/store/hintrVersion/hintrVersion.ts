import { Module } from "vuex";
import { actions } from "./actions";
import { mutations } from "./mutations";
import { HintrVersionResponse } from "../../generated";
import { RootState } from "../../root";
import { localStorageManager } from "../../localStorageManager";
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
const existingState = localStorageManager.getState();

export const hintrVersion: Module<HintrVersionState, DataExplorationState> = {
    namespaced,
    state: { ...initialHintrVersionState(), ...existingState && existingState.hintrVersion },
    actions,
    mutations
};