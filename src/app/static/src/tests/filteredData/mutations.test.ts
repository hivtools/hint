import {mutations} from "../../app/store/filteredData/mutations";
import {DataType, FilterType, initialFilteredDataState} from "../../app/store/filteredData/filteredData";


function testFilterAddedAndRemoved(filterType: FilterType) {
    const testState = {...initialFilteredDataState};
    mutations.FilterAdded(testState, {
        payload: [filterType, "value" ]
    });
    expect(testState.selectedFilters.byType(filterType)).toStrictEqual(["value"]);

    //Adding again should have no effect
    mutations.FilterAdded(testState, {
        payload: [filterType, "value" ]
    });
    expect(testState.selectedFilters.byType(filterType)).toStrictEqual(["value"]);

    //Removing non existing filter should have no effect
    mutations.FilterRemoved(testState, {
        payload: [filterType, "nonexistent" ]
    });
    expect(testState.selectedFilters.byType(filterType)).toStrictEqual(["value"]);

    //Can remove
    mutations.FilterRemoved(testState, {
        payload: [filterType, "value" ]
    });
    expect(testState.selectedFilters.byType(filterType)).toStrictEqual([]);
}

describe("FilteredData mutations", () => {

    it("sets selectedDataType on SelectedDataTypeUpdated", () => {

        const testState = {...initialFilteredDataState};
        mutations.SelectedDataTypeUpdated(testState, {
            payload: DataType.Program
        });
        expect(testState.selectedDataType).toBe(DataType.Program);
    });

    it("adds and removes age filters", () => {
        testFilterAddedAndRemoved(FilterType.Age);
    });

    it("adds and removes region filters", () => {
        testFilterAddedAndRemoved(FilterType.Region);
    });

    it("adds and removes sex filters", () => {
        testFilterAddedAndRemoved(FilterType.Sex);
    });

    it("adds and removes survey filters", () => {
        testFilterAddedAndRemoved(FilterType.Survey);
    });

});
