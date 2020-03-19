import {Dict} from "../../types";
import {localStorageManager} from "../../localStorageManager";
import {Module} from "vuex";
import {RootState} from "../../root";
import {getters} from "./getters";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface ColourScalesState {
    survey: ColourScaleSelections,
    anc: ColourScaleSelections,
    program: ColourScaleSelections,
    output: ColourScaleSelections
}

export enum ColourScaleType {Default, Custom, DynamicFull}

export type ColourScaleSelections = Dict<ColourScaleSettings>;

export interface ColourScaleSettings {
    type: ColourScaleType
    customMin: number,
    customMax: number
}

export const initialColourScaleSettings = (): ColourScaleSettings => {
    return {
        type: ColourScaleType.Default,
        customMin: 0,
        customMax: 0
    }
};

export const initialColourScalesState = (): ColourScalesState => {
  return {
      survey: {},
      anc: {},
      program: {},
      output: {}
  }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const colourScales: Module<ColourScalesState, RootState> = {
    namespaced,
    state: {...initialColourScalesState(), ...existingState && existingState.colourScales},
    getters,
    actions,
    mutations
};
