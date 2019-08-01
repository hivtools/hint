import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState, StepState} from "../../main";
import {GeoJSON} from "geojson";

export interface SurveyAndProgramDataState extends StepState {
    surveyGeoJson: GeoJSON | null
    surveyError: string,
    surveyFileName: string,
    programGeoJson: GeoJSON | null,
    programError: string

}

export const initialSurveyAndProgramDataState: SurveyAndProgramDataState = {
    surveyGeoJson: null,
    surveyError: "",
    surveyFileName: "",
    programGeoJson: null,
    programError: "",
    complete: false
};

const namespaced: boolean = true;

export const surveyAndProgram: Module<SurveyAndProgramDataState, RootState> = {
    namespaced,
    state: initialSurveyAndProgramDataState,
    getters: {},
    actions,
    mutations
};
