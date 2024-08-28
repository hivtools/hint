import {
    mockAncResponse,
    mockBaselineState,
    mockRootState,
    mockShapeResponse,
    mockSurveyAndProgramState
} from "../mocks";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {addAreaLevelsToSAPData} from "../../app/store/plotData/utils";

it("can add area level to SAP data", () => {
    const data = [
        {
            area_id: "MWI_1",
            age_group: "15-49",
            year: 2000,
            anc_clients: 1,
            anc_known_pos: 2,
            anc_already_art: 3,
            anc_tested: 4,
            anc_tested_pos: 5,
            anc_prevalence: 6,
            anc_art_coverage: 7,
        }
    ];
    const expectedData = structuredClone(data) as any[];
    expectedData[0]["area_level"] = 1;
    const rootState = mockRootState({
        baseline: mockBaselineState({
            iso3: "MWI",
            shape: mockShapeResponse({
                data: {
                    "type": "FeatureCollection",
                    "features": [{
                        properties: {
                            area_id: "MWI_1",
                            area_level: 1
                        }
                    }]
                }
            })
        }),
        surveyAndProgram: mockSurveyAndProgramState({
            anc: mockAncResponse({
                data
            })
        })
    });

    const commit = vi.fn();

    addAreaLevelsToSAPData(rootState, "anc", commit);

    expect(commit.mock.calls.length).toBe(1);
    expect(commit.mock.calls[0][0]).toStrictEqual(`surveyAndProgram/${SurveyAndProgramMutation.ANCUpdated}`);
    expect(commit.mock.calls[0][1].payload.data).toStrictEqual(expectedData);
});
