import {FilterType,initialSelectedFilters} from "../../app/store/filteredData/filteredData";

describe("Initial selectedFilters", () => {
    it("gets correct filters by type", () => {
        const testState = {
            ...initialSelectedFilters,
            sex: [{id: "sex_1", name: "female"}],
            age: [{id: "age_1", name: "0-5"}],
            region: [{id: "region_1", name: "MWI1"}],
            surveys: [{id: "survey_1", name: "Survey 1"}]
        };

        expect(testState.getByType(FilterType.Sex)).toStrictEqual([{id: "sex_1", name: "female"}]);
        expect(testState.getByType(FilterType.Age)).toStrictEqual([{id: "age_1", name: "0-5"}]);
        expect(testState.getByType(FilterType.Region)).toStrictEqual([{id: "region_1", name: "MWI1"}]);
        expect(testState.getByType(FilterType.Survey)).toStrictEqual([{id: "survey_1", name: "Survey 1"}]);
    });

    it("updates correct filters by type", () => {
        const testState = {
            ...initialSelectedFilters
        };

        testState.updateByType(FilterType.Sex, [{id: "sex_1", name: "female"}]);
        testState.updateByType(FilterType.Age, [{id: "age_1", name: "0-5"}]);
        testState.updateByType(FilterType.Region, [{id: "region_1", name: "MWI1"}]);
        testState.updateByType(FilterType.Survey, [{id: "survey_1", name: "Survey 1"}]);

        expect(testState.sex).toStrictEqual([{id: "sex_1", name: "female"}]);
        expect(testState.age).toStrictEqual([{id: "age_1", name: "0-5"}]);
        expect(testState.region).toStrictEqual([{id: "region_1", name: "MWI1"}]);
        expect(testState.surveys).toStrictEqual([{id: "survey_1", name: "Survey 1"}]);
    });
});