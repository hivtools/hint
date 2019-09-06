import {mutations} from "../../app/store/filteredData/mutations";
import {DataType} from "../../app/store/filteredData/filteredData";
import {initialFilteredDataState} from "../../app/store/filteredData/filteredData";


describe("FilteredData mutations", () => {

    it("sets selectedDataType on SelectedDataTypeUpdated", () => {

        const testState = {...initialFilteredDataState};
        mutations.SelectedDataTypeUpdated(testState, {
            payload: DataType.Program
        });
        expect(testState.selectedDataType).toBe(DataType.Program);
    });

});
