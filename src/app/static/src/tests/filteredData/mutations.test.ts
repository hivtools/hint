import {mutations} from "../../app/store/surveyAndProgramData/mutations";
import {
    DataType,
    FilterType,
    initialFilteredDataState,
    SelectedChoroplethFilters
} from "../../app/store/surveyAndProgramData/filteredData";
import {mockFilteredDataState} from "../mocks";

describe("FilteredData mutations", () => {

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
            case (FilterType.Year):
                return selectedFilters.year;
            case (FilterType.Quarter):
                return selectedFilters.quarter;
        }
    };

    const testChoroplethFilterUpdated = (filterType: FilterType) => {
        const testState = {...initialFilteredDataState()};

        //initial sate
        let expectedInitialState = "" as any;
        if (filterType == FilterType.Region){
            expectedInitialState = [];
        }

        expect(getSelectedChoroplethFilterByType(testState.selectedChoroplethFilters, filterType))
            .toStrictEqual(expectedInitialState);

        mutations.ChoroplethFilterUpdated(testState, {
            payload: [filterType, "test"]
        });

        expect(getSelectedChoroplethFilterByType(testState.selectedChoroplethFilters, filterType))
            .toBe("test");
    };

    it("sets selectedDataType on SelectedDataTypeUpdated", () => {

        const testState = mockFilteredDataState();
        mutations.SelectedDataTypeUpdated(testState, {
            payload: DataType.Program
        });
        expect(testState.selectedDataType).toBe(DataType.Program);
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
    it("updates year choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Year);
    });
    it("updates quarter choropleth filter", () => {
        testChoroplethFilterUpdated(FilterType.Quarter);
    });

});
