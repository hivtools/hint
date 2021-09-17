import {
    mockBaselineState, mockDataset,
    mockError,
    mockMetadataState,
    mockModelOptionsState,
    mockModelOutputState,
    mockModelRunState,
    mockPlottingSelections,
    mockStepperState,
    mockSurveyAndProgramState,
    mockProjectsState,
    mockModelCalibrateState,
    mockHintrVersionState
} from "./mocks";
import {localStorageManager, serialiseState} from "../app/localStorageManager";
import {RootState} from "../app/root";
import {DataType} from "../app/store/surveyAndProgram/surveyAndProgram";
import {currentHintVersion} from "../app/hintVersion";

declare const currentUser: string; // set in jest config, or on the index page when run for real

describe("LocalStorageManager", () => {
    it("serialiseState removes errors, saves selected data type", async () => {
        const mockRoot = {
            version: "1.0.0",
            baseline: mockBaselineState(),
            modelRun: mockModelRunState({
                errors: [mockError("modelRunError1"), mockError("modelRunError2")]
            }),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: mockModelCalibrateState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState({plottingMetadataError: mockError("metadataError")}),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: mockSurveyAndProgramState({selectedDataType: DataType.Survey}),
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState()
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            version: "1.0.0",
            baseline: {selectedDataset: null},
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: mockModelCalibrateState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: {selectedDataType: DataType.Survey},
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState()
        });
    });

    it("serialiseState saves selectedDataset from baseline", async () => {
        const dataset = mockDataset();
        const mockRoot = {
            version: "1.0.0",
            baseline: mockBaselineState({
                selectedDataset: dataset
            }),
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: mockModelCalibrateState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: mockSurveyAndProgramState(),
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState()
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            version: "1.0.0",
            baseline: {
                selectedDataset: dataset
            },
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: mockModelCalibrateState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: {selectedDataType: null},
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState()
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
    });

    it("saves to local storage", () => {
        const spy = jest.spyOn(Storage.prototype, "setItem");
        const testState = {baseline: mockBaselineState()};
        localStorageManager.savePartialState(testState);

        expect(spy.mock.calls[0][0]).toBe(`hintAppState_v${currentHintVersion}`);
        expect(spy.mock.calls[0][1]).toBe(JSON.stringify(testState));
    });

    it("can save and get continue as guest from session", () => {
        sessionStorage.setItem("asGuest", "continueAsGuest")
        let result = sessionStorage.getItem("asGuest")

        expect(result).not.toBe(null);
        expect(sessionStorage.getItem("asGuest")).toBe("continueAsGuest");
    });
});
