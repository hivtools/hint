import {getters} from "../../app/store/plottingSelections/getters";
import {
    mockColourScales,
    mockPlottingSelections,
    mockRootState,
    mockModelCalibrateState,
    mockDownloadPlotData
} from "../mocks";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";

const rootState = mockRootState({
    modelCalibrate: mockModelCalibrateState({
        calibratePlotResult: {
            plottingMetadata: {
                barchart: {
                    defaults: "test",
                }
            }
        }
    })
});

describe("PlottingSelections getters", () => {
    it("selectedSAPColourScales returns correct colourScales", () => {
        const state = mockPlottingSelections({
            colourScales: mockColourScales(
                {
                    survey: "SURVEY" as any,
                    program: "PROGRAM" as any,
                    anc: "ANC" as any
                })
        });

        const rootState = mockRootState();

        rootState.surveyAndProgram.selectedDataType = DataType.Survey;
        const survey = getters.selectedSAPColourScales(state, null, rootState);
        expect(survey).toBe(state.colourScales.survey);

        rootState.surveyAndProgram.selectedDataType = DataType.Program;
        const program = getters.selectedSAPColourScales(state, null, rootState);
        expect(program).toBe(state.colourScales.program);

        rootState.surveyAndProgram.selectedDataType = DataType.ANC;
        const anc = getters.selectedSAPColourScales(state, null, rootState);
        expect(anc).toBe(state.colourScales.anc);

        rootState.surveyAndProgram.selectedDataType = 99 as DataType;
        const unknown = getters.selectedSAPColourScales(state, null, rootState);
        expect(unknown).toStrictEqual({});
    });

    it('downloadFile can trigger download service with param', () => {
        rootState.surveyAndProgram.selectedDataType = 99 as DataType;
        const mockDownload = jest.fn().mockImplementation(() => getters.downloadFile())
        mockDownload(mockDownloadPlotData({
            unfilteredData: [
                {
                    "area_id": "MWI",
                    "area_name": "Malawi",
                    "value": 1000
                },
                {
                    "area_id": "MWI",
                    "area_name": "Malawi",
                    "value": 2000
                }
            ]
        }))
        expect(mockDownload).toHaveBeenCalledTimes(1)
        expect(mockDownload).toHaveBeenCalledWith(
            {
                filteredData: [
                    {
                        "area_id": "MWI",
                        "area_name": "Malawi",
                        "value": 20
                    }
                ],
                unfilteredData: [
                    {
                        "area_id": "MWI",
                        "area_name": "Malawi",
                        "value": 1000
                    },
                    {
                        "area_id": "MWI",
                        "area_name": "Malawi",
                        "value": 2000
                    }
                ]
            })
    });

});