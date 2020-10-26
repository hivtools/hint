import {getters} from "../../app/store/plottingSelections/getters";
import {mockColourScales, mockPlottingSelections, mockRootState} from "../mocks";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";

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
});