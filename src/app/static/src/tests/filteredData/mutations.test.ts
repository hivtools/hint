import {mutations} from "../../app/store/filteredData/mutations";
import {DataType, FilterType, initialFilteredDataState} from "../../app/store/filteredData/filteredData";

describe("FilteredData mutations", () => {


    const testFilterUpdated = (filterType: FilterType) => {
        const testState = {...initialFilteredDataState};

        //initial sate
        expect(testState.selectedFilters.getByType(filterType)).toStrictEqual([]);

        mutations.FilterUpdated(testState, {
            payload: [filterType, ["value1", "value2"]]
        });
        expect(testState.selectedFilters.getByType(filterType)).toStrictEqual(["value1", "value2"]);
    };

    it("sets selectedDataType on SelectedDataTypeUpdated", () => {

        const testState = {...initialFilteredDataState};
        mutations.SelectedDataTypeUpdated(testState, {
            payload: DataType.Program
        });
        expect(testState.selectedDataType).toBe(DataType.Program);
    });

    it("adds and removes age filters", () => {
        testFilterUpdated(FilterType.Age);
    });

    it("adds and removes region filters", () => {
        testFilterUpdated(FilterType.Region);
    });

    it("adds and removes sex filters", () => {
        testFilterUpdated(FilterType.Sex);
    });

    it("adds and removes survey filters", () => {
        testFilterUpdated(FilterType.Survey);
    });

});
