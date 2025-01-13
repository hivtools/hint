import {SurveyAndProgramState} from "./surveyAndProgram";

export const getters = {
    complete: (state: SurveyAndProgramState) => {
        return !!state.survey && !state.programError && !state.ancError
    },

    hasChanges: (state: SurveyAndProgramState) => {
        return !!state.survey || !!state.program || !!state.anc
    },
};
