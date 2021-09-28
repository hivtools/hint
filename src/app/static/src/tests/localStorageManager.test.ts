import {
    mockBaselineState, mockDataset,
    mockRelease,
    mockError,
    mockHintrVersionState,
    mockMetadataState,
    mockModelCalibrateState,
    mockModelOptionsState,
    mockModelOutputState,
    mockModelRunState,
    mockPlottingSelections,
    mockProjectsState,
    mockStepperState,
    mockSurveyAndProgramState
} from "./mocks";
import {localStorageManager, serialiseState} from "../app/localStorageManager";
import {RootState} from "../app/root";
import {DataType} from "../app/store/surveyAndProgram/surveyAndProgram";
import {currentHintVersion} from "../app/hintVersion";
import {Language} from "../app/store/translations/locales";
import registerTranslations from "../app/store/translations/registerTranslations";
import Vuex from 'vuex';
import i18next from "i18next";

declare const currentUser: string; // set in jest config, or on the index page when run for real

describe("LocalStorageManager", () => {

    afterEach(() => {
        jest.clearAllMocks();
    })

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
            hintrVersion: mockHintrVersionState(),
            language: Language.en
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            version: "1.0.0",
            baseline: {selectedDataset: null, selectedRelease: null},
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: mockModelCalibrateState(),
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            plottingSelections: mockPlottingSelections(),
            surveyAndProgram: {selectedDataType: DataType.Survey},
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState(),
            language: Language.en
        });
    });

    it("serialiseState saves selectedDataset and selectedRelease from baseline", async () => {
        const dataset = mockDataset();
        const release = mockRelease();
        const mockRoot = {
            version: "1.0.0",
            baseline: mockBaselineState({
                selectedDataset: dataset,
                selectedRelease: release
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
            hintrVersion: mockHintrVersionState(),
            language: Language.en
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            version: "1.0.0",
            baseline: {
                selectedDataset: dataset,
                selectedRelease: release
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
            hintrVersion: mockHintrVersionState(),
            language: Language.en
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

    it("can set and get language from local storage", () => {
        const spy = jest.spyOn(Storage.prototype, "setItem");

        const testState = {language: Language.pt};
        localStorageManager.savePartialState(testState);

        expect(localStorageManager.getState()?.language).toBe(Language.pt)
        expect(spy.mock.calls[0][1]).toBe(JSON.stringify(testState))
    });

    it("can initiate default language from store", () => {
        const store = new Vuex.Store({
            state: {language: Language.fr}
        });

        registerTranslations(store);
        expect(i18next.language).toBe("fr");
    });
});
