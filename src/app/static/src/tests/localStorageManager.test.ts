import {
    mockError,
    mockMetadataState,
    mockModelOptionsState,
    mockModelOutputState,
    mockModelRunState, mockPlottingSelections,
    mockStepperState
} from "./mocks";
import {serialiseState} from "../app/localStorageManager";
import {RootState} from "../app/root";

describe("LocalStorageManager", () => {
    it("serialiseState removes errors", async () => {
        const mockRoot = {
            modelRun: mockModelRunState({
                errors: [mockError("modelRunError1"), mockError("modelRunError2")]
            }),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState({plottingMetadataError: mockError("metadataError")}),
            plottingSelections: mockPlottingSelections()
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual( {
                modelRun: mockModelRunState(),
                modelOptions: mockModelOptionsState(),
                modelOutput: mockModelOutputState(),
                stepper: mockStepperState(),
                metadata: mockMetadataState(),
                plottingSelections: mockPlottingSelections()
            });
    });
});