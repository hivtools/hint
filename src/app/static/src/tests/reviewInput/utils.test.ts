import {commitCountryLevelPopulationData} from "../../app/store/reviewInput/utils";
import {PopulationResponseData} from "../../app/generated";
import {mockBaselineState, mockPopulationResponse, mockRootState} from "../mocks";

describe("utils work as expected", () => {

    const mockPopData: PopulationResponseData = [
        {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 10},
        {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "male", age_group: "Y000_004", population: 12},
        {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 8},
        {area_id: "MWI_1_1", area_name: "Northern", calendar_quarter: "CY2018Q1", sex: "female", age_group: "Y000_004", population: 5},
    ];

    const rootState = mockRootState({
        baseline: mockBaselineState({
            population: mockPopulationResponse({
                data: mockPopData
            })
        })
    });

    const rootGetters = {
        "reviewInput/ageGroupOptions": [
            {
                label: "00-04",
                id: "Y000_004"
            }
        ]
    };

    it("can commit country level population data", () => {
        const commit = vi.fn();
        commitCountryLevelPopulationData(commit, rootState, rootGetters);

        expect(commit).toHaveBeenCalledTimes(1);
        expect(commit.mock.calls[0][0].payload).toHaveLength(2);
    })
})
