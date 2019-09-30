import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.saveState({
    filteredData: {
        selectedDataType: 0
    }
} as any);

import {DataType, filteredData, FilteredDataState} from "../../app/store/filteredData/filteredData";

it("loads initial state from local storage", () => {
    const state = filteredData.state as FilteredDataState;
    expect(state.selectedDataType).toBe(DataType.ANC);
});
