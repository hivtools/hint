import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import axios, {AxiosResponse} from 'axios';
import {APIError, PJNZ} from "../../types";
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";

export type SurveyAndProgramActionTypes = "SurveyLoaded" | "SurveyError"

export interface SurveyAndProgramPayload extends ActionPayload {
    type: SurveyAndProgramActionTypes
}

export interface SurveyLoaded extends SurveyAndProgramPayload {
    geoJson: string
}

export interface SurveyError extends SurveyAndProgramPayload {
    error: string
}

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, file: File) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    uploadSurvey({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        axios.post("/survey/upload", formData)
            .then((response: AxiosResponse) => {
                const payload: PJNZ = response && response.data;
                console.log(payload);
                commit<SurveyAndProgramPayload>({type: "SurveyLoaded", payload});
            })
            .catch((e: {response: {data: APIError}}) => {
                const error = e.response.data;
                console.log(error);
                commit<SurveyAndProgramPayload>({type: 'SurveyError', payload: error.message});
            });
    }
};

