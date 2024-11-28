import {PopulationResponseData} from "../../app/generated";
import {aggregatePopulation} from "../../app/store/plotData/aggregate";

describe("aggregate data", () => {
    const areaIdToLevelMap = {
        "MWI": 0,
        "MWI_1_1": 1,
        "MWI_1_2": 1,
        "MWI_2_1": 2,
        "MWI_2_2": 2,
        "MWI_2_3": 2,
    }
    const areaIdToParentPath = {
        "MWI": [],
        "MWI_1_1": ["MWI"],
        "MWI_1_2": ["MWI"],
        "MWI_2_1": ["MWI", "MWI_1_1"],
        "MWI_2_2": ["MWI", "MWI_1_1"],
        "MWI_2_3": ["MWI", "MWI_1_2"],
    }
    const areaIdToAreaName = {
        "MWI": "Malawi",
        "MWI_1_1": "Northern",
        "MWI_1_2": "Central",
        "MWI_2_1": "Chitipa",
        "MWI_2_2": "Karonga",
        "MWI_2_3": "Mchinji",
    }

    it("can aggregate population data to different levels", () => {
        const data: PopulationResponseData = [
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 12},
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 13},
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 15},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 9},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 8},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 11},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 13},
            {area_id: "MWI_2_3", area_name: "C", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 23},
            {area_id: "MWI_2_3", area_name: "C", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 22},
            {area_id: "MWI_2_3", area_name: "C", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 24},
            {area_id: "MWI_2_3", area_name: "C", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 25}
        ]

        const res = aggregatePopulation(data, 1, areaIdToLevelMap, areaIdToParentPath, areaIdToAreaName)
        const expected: PopulationResponseData = [
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10 + 9},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 12 + 8},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 13 + 11},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 15 + 13},
            {area_id: "MWI_1_2", area_name: "Central", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 23},
            {area_id: "MWI_1_2", area_name: "Central", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 22},
            {area_id: "MWI_1_2", area_name: "Central", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 24},
            {area_id: "MWI_1_2", area_name: "Central", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 25}
        ];
        expect(res).toStrictEqual(expected);

        const resLevel0 = aggregatePopulation(data, 0, areaIdToLevelMap, areaIdToParentPath, areaIdToAreaName)
        const expectedLevel0: PopulationResponseData = [
            {area_id: "MWI", area_name: "Malawi", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10 + 9 + 23},
            {area_id: "MWI", area_name: "Malawi", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 12 + 8 + 22},
            {area_id: "MWI", area_name: "Malawi", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 13 + 11 + 24},
            {area_id: "MWI", area_name: "Malawi", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 15 + 13 + 25},
        ];
        expect(resLevel0).toStrictEqual(expectedLevel0);
    });

    it("groups by calendar quarter when aggregating", () => {
        const data: PopulationResponseData = [
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 12},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 9},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 8},
        ];
        const expected: PopulationResponseData = [
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10 + 9},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 12 + 8},
        ]
        const res = aggregatePopulation(data, 1, areaIdToLevelMap, areaIdToParentPath, areaIdToAreaName);
        expect(res).toStrictEqual(expected);
    });

    it("returns existing data if already in input data", () => {
        const expected: PopulationResponseData = [
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 300},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 400},
        ]
        const data: PopulationResponseData = [
            ...expected,
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
            {area_id: "MWI_2_1", area_name: "A", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 12},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 9},
            {area_id: "MWI_2_2", area_name: "B", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 8},
        ];
        const res = aggregatePopulation(data, 1, areaIdToLevelMap, areaIdToParentPath, areaIdToAreaName);
        expect(res).toStrictEqual(expected);
    });

    it("returns empty if asked to aggregate downward", () => {
        const data: PopulationResponseData = [
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 300},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 400},
        ]
        const res = aggregatePopulation(data, 2, areaIdToLevelMap, areaIdToParentPath, areaIdToAreaName);
        expect(res).toStrictEqual([]);
    });
})
