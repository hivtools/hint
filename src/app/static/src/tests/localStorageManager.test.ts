import {
    mockBaselineState,
    mockError,
    mockMetadataState,
    mockModelOptionsState,
    mockModelOutputState,
    mockModelRunState,
    mockPlottingSelections,
    mockStepperState,
    mockSurveyAndProgramState,
    mockVersionsState
} from "./mocks";
import {localStorageManager, serialiseState} from "../app/localStorageManager";
import {RootState} from "../app/root";
import {DataType} from "../app/store/surveyAndProgram/surveyAndProgram";

declare const currentUser: string; // set in jest config, or on the index page when run for real

describe("LocalStorageManager", () => {
    it("serialiseState removes errors, saves selected data type", async () => {
        const mockRoot = {
            baseline: mockBaselineState(),
            modelRun: mockModelRunState({
                errors: [mockError("modelRunError1"), mockError("modelRunError2")]
            }),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState({plottingMetadataError: mockError("metadataError")}),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: mockSurveyAndProgramState({selectedDataType: DataType.Survey}),
            versions: mockVersionsState()
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            baseline: {selectedDataset: null},
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: {selectedDataType: DataType.Survey},
            versions: mockVersionsState()
        });
    });

    it("serialiseState saves selectedDataset from baseline", async () => {
        const mockRoot = {
            baseline: mockBaselineState({
                selectedDataset: {
                    id: "123",
                    revision_id: "456",
                    title: "Some data",
                    url: "www.some.url"
                }
            }),
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: mockSurveyAndProgramState(),
            versions: mockVersionsState()
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            baseline: {
                selectedDataset: {
                    id: "123",
                    revision_id: "456",
                    title: "Some data",
                    url: "www.some.url"
                }
            },
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: {selectedDataType: null},
            versions: mockVersionsState()
        });
    });

    it("returns nothing and saves current user if local storage does not match current user", () => {
        localStorage.setItem("user", currentUser);
        localStorageManager.savePartialState({errors: {errors: [{error: "test", detail: "test"}]}});
        let result = localStorageManager.getState();
        expect(result).not.toBe(null);
        expect(localStorage.getItem("user")).toBe(currentUser);

        localStorage.setItem("user", "bad-user");
        result = localStorageManager.getState();
        expect(result).toBe(null);
        expect(localStorage.getItem("user")).toBe(currentUser);
    })
});
