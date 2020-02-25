import {
    mockError,
    mockMetadataState,
    mockModelOptionsState,
    mockModelOutputState,
    mockModelRunState,
    mockPlottingSelections,
    mockStepperState,
    mockSurveyAndProgramState
} from "./mocks";
import {serialiseState} from "../app/localStorageManager";
import {RootState} from "../app/root";
import {DataType} from "../app/store/surveyAndProgram/surveyAndProgram";

describe("LocalStorageManager", () => {
    it("serialiseState removes errors, saves selected data type", async () => {
        const mockRoot = {
            modelRun: mockModelRunState({
                errors: [mockError("modelRunError1"), mockError("modelRunError2")]
            }),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState({plottingMetadataError: mockError("metadataError")}),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: mockSurveyAndProgramState({selectedDataType: DataType.Survey})
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual( {
                modelRun: mockModelRunState(),
                modelOptions: mockModelOptionsState(),
                modelOutput: mockModelOutputState(),
                stepper: mockStepperState(),
                metadata: mockMetadataState(),
                plottingSelections: mockPlottingSelections(),
                surveyAndProgram: {selectedDataType: DataType.Survey}
            });
    });
});