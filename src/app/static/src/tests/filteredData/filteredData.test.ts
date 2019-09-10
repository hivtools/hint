import {FilterType,initialSelectedFilters} from "../../app/store/filteredData/filteredData";

describe("Initial selectedFilters", () => {
    it("gets correct filters by type", () => {
        const testState = {
            ...initialSelectedFilters,
            sex: ["female"],
            age: ["0-5"],
            region: ["MWI1"],
            survey: ["s1"]
        };

        expect(testState.getByType(FilterType.Sex)).toStrictEqual(["female"]);
        expect(testState.getByType(FilterType.Age)).toStrictEqual(["0-5"]);
        expect(testState.getByType(FilterType.Region)).toStrictEqual(["MWI1"]);
        expect(testState.getByType(FilterType.Survey)).toStrictEqual(["s1"]);
    });

    it("updates correct filters by type", () => {
        const testState = {
            ...initialSelectedFilters
        };

        testState.updateByType(FilterType.Sex, ["female"]);
        testState.updateByType(FilterType.Age, ["0-5"]);
        testState.updateByType(FilterType.Region, ["MWI1"]);
        testState.updateByType(FilterType.Survey, ["s1"]);

        expect(testState.sex).toStrictEqual(["female"]);
        expect(testState.age).toStrictEqual(["0-5"]);
        expect(testState.region).toStrictEqual(["MWI1"]);
        expect(testState.survey).toStrictEqual(["s1"]);
    });
});