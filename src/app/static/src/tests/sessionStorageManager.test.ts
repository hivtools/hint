import {
    mockADRState,
    mockADRUploadState,
    mockBaselineState,
    mockCalibrateDataResponse,
    mockCalibratePlotResponse,
    mockComparisonPlotResponse,
    mockDataset,
    mockDownloadResultsState,
    mockError,
    mockErrorsState,
    mockReviewInputState,
    mockHintrVersionState,
    mockLoadState,
    mockMetadataState,
    mockModelCalibrateState,
    mockModelOptionsState,
    mockModelOutputState,
    mockModelRunState,
    mockPlotDataState,
    mockPlotSelections,
    mockPlotState,
    mockProjectsState,
    mockRootState,
    mockRelease,
    mockStepperState,
    mockSurveyAndProgramState
} from "./mocks";
import {serialiseState, sessionStorageManager} from "../app/sessionStorageManager";
import {localStorageManager} from "../app/localStorageManager";
import {RootState} from "../app/root";
import {currentHintVersion} from "../app/hintVersion";
import {Language} from "../app/store/translations/locales";

declare const currentUser: string; // set in jest config, or on the index page when run for real

describe("SessionStorageManager", () => {

    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    })

    const modelCalibrateResponse = {
        calibrateId: "",
        calibratePlotResult: null,
        comparisonPlotError: null,
        calibrating: false,
        complete: false,
        error: null,
        fetching: false,
        generatingCalibrationPlot: false,
        metadata: null,
        comparisonPlotResult: null,
        options: {},
        optionsFormMeta: {
            "controlSections": [],
        },
        ready: false,
        result: null,
        fetchedIndicators: null,
        status: {},
        statusPollId: -1,
        version: {
            "hintr": "unknown",
            "naomi": "unknown",
            "rrq": "unknown",
        },
        warnings: [],
    }


    it("serialises RootState as expected", async () => {
        const dataset = mockDataset();
        const release = mockRelease();
        const mockRoot = {
            version: "1.0.0",
            currentUser: "some user",
            updatingLanguage: false,
            adr: mockADRState(),
            reviewInput: mockReviewInputState(),
            adrUpload: mockADRUploadState(),
            baseline: mockBaselineState({
                selectedDataset: dataset,
                selectedRelease: release
            }),
            modelRun: mockModelRunState({
                errors: [mockError("modelRunError1"), mockError("modelRunError2")]
            }),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: mockModelCalibrateState({
                result: {data: mockCalibrateDataResponse()},
                fetchedIndicators: [],
                calibratePlotResult: mockCalibratePlotResponse(),
                comparisonPlotResult: mockComparisonPlotResponse()
            }),
            stepper: mockStepperState(),
            load: mockLoadState(),
            downloadResults: mockDownloadResultsState(),
            invalidSteps: [],
            language: Language.en,
            metadata: mockMetadataState({reviewInputMetadataError: mockError("metadataError")}),
            plotData: mockPlotDataState(),
            plotSelections: mockPlotSelections(),
            plotState: mockPlotState(),
            surveyAndProgram: mockSurveyAndProgramState({
                warnings: [{text: "test warning", locations: ["review_inputs"]}]
            }),
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState(),
            errors: mockErrorsState()
        } as RootState;

        const result = serialiseState(mockRoot);
        expect(result).toStrictEqual({
            version: "1.0.0",
            baseline: {
                selectedDataset: dataset,
                selectedRelease: release,
                selectedDatasetIsRefreshed: false
            },
            modelRun: mockModelRunState(),
            modelOptions: mockModelOptionsState(),
            modelOutput: mockModelOutputState(),
            modelCalibrate: modelCalibrateResponse,
            stepper: mockStepperState(),
            metadata: mockMetadataState(),
            surveyAndProgram: {
                warnings: [{text: "test warning", locations: ["review_inputs"]}]
            },
            hintrVersion: mockHintrVersionState()
        });
    });

    it("returns nothing and saves current user if session storage does not match current user", () => {
        sessionStorage.setItem("hintUser", currentUser);
        sessionStorageManager.savePartialState({errors: {
            errors: [{error: "test", detail: "test"}],
            errorReportError: null,
            errorReportSuccess: false,
            sendingErrorReport: false
        }});
        sessionStorageManager.saveVersionId("version1");
        let result = sessionStorageManager.getState();
        expect(result).not.toBe(null);
        expect(sessionStorage.getItem("hintUser")).toBe(currentUser);
        expect(sessionStorageManager.getVersionId()).toBe("version1");

        sessionStorage.setItem("hintUser", "bad-user");
        result = sessionStorageManager.getState();
        expect(result).toBe(null);
        expect(sessionStorage.getItem("hintUser")).toBe(currentUser);
        expect(sessionStorageManager.getVersionId()).toBe(null);
    });

    it("clearing the tab leaves other things in session storage alone", () => {
        sessionStorage.setItem("asGuest", "continueAsGuest");
        sessionStorageManager.savePartialState({baseline: mockBaselineState()});
        sessionStorageManager.saveVersionId("version1");

        sessionStorageManager.clear();

        expect(sessionStorageManager.getVersionId()).toBe(null);
        expect(sessionStorage.getItem(`hintAppState_v${currentHintVersion}`)).toBe(null);
        expect(sessionStorage.getItem("asGuest")).toBe("continueAsGuest");
    });

    it("saves to session storage, not local storage", () => {
        const sessionSpy = vi.spyOn(Storage.prototype, "setItem");
        const testState = {baseline: mockBaselineState()};
        sessionStorageManager.savePartialState(testState);

        expect(sessionSpy.mock.calls[0][0]).toBe(`hintAppState_v${currentHintVersion}`);
        expect(sessionSpy.mock.calls[0][1]).toBe(JSON.stringify(testState));
        expect(sessionStorage.getItem(`hintAppState_v${currentHintVersion}`)).toBe(JSON.stringify(testState));
        expect(localStorage.getItem(`hintAppState_v${currentHintVersion}`)).toBe(null);
    });

    it("can get from session storage, with the language from local storage", () => {
        localStorageManager.saveLanguage(Language.pt);
        sessionStorage.setItem("hintUser", currentUser);
        const testState = {baseline: mockBaselineState()};
        sessionStorageManager.savePartialState(testState);

        const result = sessionStorageManager.getState();
        expect(result).toStrictEqual({...testState, language: Language.pt});
    });

    it("can save, get and remove the version id", () => {
        expect(sessionStorageManager.getVersionId()).toBe(null);

        sessionStorageManager.saveVersionId("version1");
        expect(sessionStorageManager.getVersionId()).toBe("version1");

        sessionStorageManager.saveVersionId(null);
        expect(sessionStorageManager.getVersionId()).toBe(null);
    });

    it("saves the serialised root state", () => {
        const state = mockRootState();
        sessionStorageManager.saveState(state);
        expect(sessionStorage.getItem(`hintAppState_v${currentHintVersion}`)).toBe(JSON.stringify(serialiseState(state)));
    });
});
