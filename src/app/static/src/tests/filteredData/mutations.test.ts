import {mutations} from "../../app/store/filteredData/mutations";
import {
    DataType,
    FilterType,
    initialFilteredDataState, SelectedChoroplethFilters,
    SelectedFilters
} from "../../app/store/filteredData/filteredData";

describe("FilteredData mutations", () => {

    const getSelectedFiltersByType = (selectedFilters: SelectedFilters, filterType: FilterType) => {
        switch (filterType) {
            case (FilterType.Age):
                return selectedFilters.age;
            case (FilterType.Region):
                return selectedFilters.region;
            case (FilterType.Sex):
                return selectedFilters.sex;
            case (FilterType.Survey):
                return selectedFilters.surveys;
        }
    };

    const getSelectedChoroplethFilterByType = (selectedFilters: SelectedChoroplethFilters, filterType: FilterType) => {
        switch (filterType) {
            case (FilterType.Age):
                return selectedFilters.age;
            case (FilterType.Sex):
                return selectedFilters.sex;
            case (FilterType.Survey):
                return selectedFilters.survey;
            case (FilterType.Region):
                return selectedFilters.regions;
        }
    };

    const testFilterUpdated = (filterType: FilterType) => {
        const testState = {...initialFilteredDataState};

        //initial sate
        expect(getSelectedFiltersByType(testState.selectedFilters, filterType)).toStrictEqual([]);

        mutations.FilterUpdated(testState, {
            payload: [filterType, ["value1", "value2"]]
        });
        expect(getSelectedFiltersByType(testState.selectedFilters, filterType)).toStrictEqual(["value1", "value2"]);
    };

    const testChoroplethFilterUpdated = (filterType: FilterType) => {
        const testState = {...initialFilteredDataState};

        //initial sate
        expect(getSelectedChoroplethFilterByType(testState.selectedChoroplethFilters, filterType)).toBeNull();

        mutations.ChoroplethFilterUpdated(testState, {
            payload: [filterType, {id: "id", name: "name"}]
        });
        expect(getSelectedChoroplethFilterByType(testState.selectedChoroplethFilters, filterType)).toStrictEqual({id: "id", name: "name"});
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
    it("updates region choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Region);
    });
});
