import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.saveState({
    filteredData: {
        selectedDataType: 0
    }
} as any);

import {DataType, surveyAndProgramData, FilteredDataState} from "../../app/store/surveyAndProgramData/filteredData";

it("loads initial state from local storage", () => {
    const state = surveyAndProgramData.state as FilteredDataState;
    expect(state.selectedDataType).toBe(DataType.ANC);
});
