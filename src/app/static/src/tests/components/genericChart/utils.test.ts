import {filterData} from "../../../app/components/genericChart/utils";

describe("filterData", () => {
    const data = [
        {"age": 1, "year": 2020, "country": "GB", value: 1},
        {"age": 2, "year": 2020, "country": "GB", value: 2},
        {"age": 1, "year": 2021, "country": "GB", value: 3},
        {"age": 2, "year": 2021, "country": "GB", value: 4},
        {"age": 1, "year": 2020, "country": "FR", value: 5},
        {"age": 2, "year": 2020, "country": "FR", value: 6},
        {"age": 1, "year": 2021, "country": "FR", value: 7},
        {"age": 2, "year": 2021, "country": "FR", value: 8},
        {"age": 2, "year": 2020, "country": "DE", value: 9}
    ];

    it("returns data unchanged for empty filters array", () => {
        const result = filterData(data, [], {});
        expect(result).toStrictEqual(data);
    });

    it("filters data using filters with single, multiple and missing filter options", () => {
        const filters = [
            {id: "age", label: "Age", column_id: "age", allowMultiple: false},
            {id: "year", label: "Year", column_id: "year", allowMultiple: false},
            {id: "country", label: "Country", column_id: "country", allowMultiple: true}
        ] as any;
        const selectedFilterOptions = {
            year: [{id: "2020", label: "2020"}],
            country: [{id: "GB", label: "United Kingdom"}, {id: "FR", label: "France"}]
        };
        const result = filterData(data, filters, selectedFilterOptions);
        expect(result).toStrictEqual([
            {"age": 1, "year": 2020, "country": "GB", value: 1},
            {"age": 2, "year": 2020, "country": "GB", value: 2},
            {"age": 1, "year": 2020, "country": "FR", value: 5},
            {"age": 2, "year": 2020, "country": "FR", value: 6}
        ]);
    });
});
