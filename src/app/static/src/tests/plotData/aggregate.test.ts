import {PopulationResponseData} from "../../app/generated";
import {aggregatePopulation} from "../../app/store/plotData/aggregate";

describe("aggregate data", () => {
    const areaIdToPropertiesMap = {
        "MWI": {area_level: 0, area_name: "Malawi", area_sort_order: 1},
        "MWI_1_1": {area_level: 1, area_name: "Northern", area_sort_order: 2},
        "MWI_1_2": {area_level: 1, area_name: "Central", area_sort_order: 3},
        "MWI_2_1": {area_level: 2, area_name: "Chitipa", area_sort_order: 4},
        "MWI_2_2": {area_level: 2, area_name: "Karonga", area_sort_order: 5},
        "MWI_2_3": {area_level: 2, area_name: "Mchinji", area_sort_order: 6},
    }
    const areaIdToParentPath = {
        "MWI": [],
        "MWI_1_1": ["MWI"],
        "MWI_1_2": ["MWI"],
        "MWI_2_1": ["MWI", "MWI_1_1"],
        "MWI_2_2": ["MWI", "MWI_1_1"],
        "MWI_2_3": ["MWI", "MWI_1_2"],
    }

    it("can aggregate population data to different levels", () => {
        const data: PopulationResponseData = [
            {area_id: "MWI_2_1", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
            {area_id: "MWI_2_1", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 12},
            {area_id: "MWI_2_1", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 13},
            {area_id: "MWI_2_1", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 15},
            {area_id: "MWI_2_2", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 9},
            {area_id: "MWI_2_2", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 8},
            {area_id: "MWI_2_2", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 11},
            {area_id: "MWI_2_2", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 13},
            {area_id: "MWI_2_3", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 23},
            {area_id: "MWI_2_3", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 22},
            {area_id: "MWI_2_3", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y005_009", population: 24},
            {area_id: "MWI_2_3", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y005_009", population: 25}
        ]

        const res = aggregatePopulation(data, 1, areaIdToPropertiesMap, areaIdToParentPath)
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

        const resLevel0 = aggregatePopulation(data, 0, areaIdToPropertiesMap, areaIdToParentPath)
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
            {area_id: "MWI_2_1", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
            {area_id: "MWI_2_1", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 12},
            {area_id: "MWI_2_2", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 9},
            {area_id: "MWI_2_2", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 8},
        ];
        const expected: PopulationResponseData = [
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10 + 9},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 12 + 8},
        ]
        const res = aggregatePopulation(data, 1, areaIdToPropertiesMap, areaIdToParentPath);
        expect(res).toStrictEqual(expected);
    });

    it("returns existing data if already in input data", () => {
        const expected: PopulationResponseData = [
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 300},
            {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 400},
        ]
        const data: PopulationResponseData = [
            {area_id: "MWI_1_1", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 300},
            {area_id: "MWI_1_1", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 400},
            {area_id: "MWI_2_1", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
            {area_id: "MWI_2_1", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 12},
            {area_id: "MWI_2_2", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 9},
            {area_id: "MWI_2_2", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 8},
        ];
        const res = aggregatePopulation(data, 1, areaIdToPropertiesMap, areaIdToParentPath);
        expect(res).toStrictEqual(expected);
    });

    it("returns empty if asked to aggregate downward", () => {
        const data: PopulationResponseData = [
            {area_id: "MWI_1_1", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 300},
            {area_id: "MWI_1_1", calendar_quarter: "CY2019Q1", sex: "male", age_group: "Y000_004", population: 400},
        ]
        const res = aggregatePopulation(data, 2, areaIdToPropertiesMap, areaIdToParentPath);
        expect(res).toStrictEqual([]);
    });
})
