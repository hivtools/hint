import {Dict} from "../../types";

export interface ColourScalesState {
    survey: ColourScaleSelections,
    anc: ColourScaleSelections,
    program: ColourScaleSelections,
    output: ColourScaleSelections
}

export enum ColourScaleType {Default, Custom}

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

export const initialColourScaleState = (): ColourScalesState => {
  return {
      survey: {},
      anc: {},
      program: {},
      output: {}
  }
};
