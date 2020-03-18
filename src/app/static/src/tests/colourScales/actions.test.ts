import {mockRootState, mockSurveyAndProgramState} from "../mocks";
import {DataType, surveyAndProgram} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {actions} from "../../app/store/colourScales/actions";
import {ColourScaleType} from "../../app/store/colourScales/colourScales";

describe("ColourScales actions", () => {
    it("commits updated colour scales", () => {
        const rootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState({
                selectedDataType: DataType.Program
            })
        });
        const commit = jest.fn();
        const colourScales = {
            prevalence: {
                type: ColourScaleType.Default
            }
        };
        actions.updateSelectedSAPColourScales({rootState, commit} as any, colourScales as any);
        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe("UpdateSAPColourScales");
        expect(commit.mock.calls[0][0].payload).toStrictEqual([DataType.Program, colourScales]);
    });

});