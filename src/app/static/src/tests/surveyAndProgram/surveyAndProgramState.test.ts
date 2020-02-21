import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.saveState({
    surveyAndProgram: {
        selectedDataType: 0
    }
} as any);

import {DataType, surveyAndProgram, SurveyAndProgramState} from "../../app/store/surveyAndProgram/surveyAndProgram";

it("loads initial state from local storage", () => {
    const state = surveyAndProgram.state as SurveyAndProgramState;
    expect(state.selectedDataType).toBe(DataType.ANC);
});
