import {getters} from "../../app/store/colourScales/getters";
import {mockColourScales, mockRootState} from "../mocks";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";

describe("ColourScales getters", () => {
    it("selectedSAPColourScales returns correct colourScales", () => {
        const state = mockColourScales(
            {
                survey: "SURVEY" as any,
                program: "PROGRAM" as any,
                anc: "ANC" as any
            }
        );

        const rootState = mockRootState();

        rootState.surveyAndProgram.selectedDataType = DataType.Survey;
        const survey = getters.selectedSAPColourScales(state, null, rootState);
        expect(survey).toBe(state.survey);

        rootState.surveyAndProgram.selectedDataType = DataType.Program;
        const program = getters.selectedSAPColourScales(state, null, rootState);
        expect(program).toBe(state.program);

        rootState.surveyAndProgram.selectedDataType = DataType.ANC;
        const anc = getters.selectedSAPColourScales(state, null, rootState);
        expect(anc).toBe(state.anc);

        rootState.surveyAndProgram.selectedDataType = 99 as DataType;
        const unknown = getters.selectedSAPColourScales(state, null, rootState);
        expect(unknown).toStrictEqual({});
    });
});