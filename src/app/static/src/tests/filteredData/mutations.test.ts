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

    const testChoroplethFilterUpdated = (filterType: FilterType) => {
        const testState = {...initialFilteredDataState};

        //initial sate
        expect(testState.selectedChoroplethFilters.getByType(filterType)).toBeNull();

        mutations.ChoroplethFilterUpdated(testState, {
            payload: [filterType, {id: "id", name: "name"}]
        });
        expect(testState.selectedChoroplethFilters.getByType(filterType)).toStrictEqual({id: "id", name: "name"});
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

    it("adds and removes surveys filters", () => {
        testFilterUpdated(FilterType.Survey);
    });

    it("updates age choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Age);
    });
    it("updates sex choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Sex);
    });
    it("updates survey choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Survey);
    });

});
