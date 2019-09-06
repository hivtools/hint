import {FilterType,initialSelectedFilters} from "../../app/store/filteredData/filteredData";

describe("Initial selectedFilters", () => {
    it("gets correct filters byType", () => {
        const testState = {
            ...initialSelectedFilters,
            sex: ["female"],
            age: ["0-5"],
            region: ["MWI1"],
            survey: ["s1"]
        };

        expect(testState.byType(FilterType.Sex)).toStrictEqual(["female"]);
        expect(testState.byType(FilterType.Age)).toStrictEqual(["0-5"]);
        expect(testState.byType(FilterType.Region)).toStrictEqual(["MWI1"]);
        expect(testState.byType(FilterType.Survey)).toStrictEqual(["s1"]);
    });
});