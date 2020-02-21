import {Module} from 'vuex';
//import {actions} from './actions';
//import {mutations} from './mutations';
import {getters} from './getters';
import {RootState} from "../../root";
import {localStorageManager} from "../../localStorageManager";

//TODO: DELETE THIS WHOLE DIRECTORY
//export enum FilterType { Sex, Age, Region, Survey, Year, Quarter }

/*export interface SelectedChoroplethFilters {
    sex: string,
    age: string,
    survey: string,
    year: string,
    regions: string[],
    quarter: string
}*/

export interface SurveyAndProgramDataState {

    //selectedChoroplethFilters: SelectedChoroplethFilters
}

/*export const initialSelectedChoroplethFilters = (): SelectedChoroplethFilters => {
    return {
        sex: "",
        age: "",
        survey: "",
        regions: [],
        year: "",
        quarter: ""
    }
};*/

export const initialSurveyAndProgramDataState = (): SurveyAndProgramDataState => {
    return {
        //selectedChoroplethFilters: initialSelectedChoroplethFilters()
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

/*export const surveyAndProgramData: Module<SurveyAndProgramDataState, RootState> = {
    namespaced,
    state: {...initialSurveyAndProgramDataState(), ...existingState && existingState.surveyAndProgramData},
    actions,
    mutations,
    getters
};*/
