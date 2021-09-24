import {actions} from "../../app/store/surveyAndProgram/actions";
import {
    mockAncResponse,
    mockAxios,
    mockError,
    mockFailure,
    mockProgramResponse,
    mockRootState,
    mockSuccess,
    mockSurveyResponse
} from "../mocks";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {expectEqualsFrozen} from "../testHelpers";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";
import Mock = jest.Mock;

const FormData = require("form-data");
const rootState = mockRootState();
const mockFormData = {
    get: (key: string) => { return key == "file" ? {name: "file.txt"} : null; }
};

describe("Survey and programme actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets data after surveys file upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(200, mockSuccess({data: "SOME DATA"}));

        const commit = jest.fn();
        await actions.uploadSurvey({commit, rootState} as any, mockFormData as any);

        checkSurveyImportUpload(commit);
    });

    it("sets data after surveys file import", async () => {

        mockAxios.onPost(`/adr/survey/`)
            .reply(200, mockSuccess({data: "SOME DATA"}));

        const commit = jest.fn();
        await actions.importSurvey({commit, rootState} as any, "some-url");

        checkSurveyImportUpload(commit);
    });

    const checkSurveyImportUpload = (commit: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: null
        });

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: {data: "SOME DATA"}
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("surveyAndProgram/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Survey});
    }

    it("sets error message after failed surveys upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadSurvey({commit, rootState} as any, mockFormData as FormData);

        checkFailedSurveyImportUpload(commit);
    });

    it("sets error message after failed surveys import", async () => {

        mockAxios.onPost(`/adr/survey/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.importSurvey({commit, rootState} as any, "some-url/file.txt");

        checkFailedSurveyImportUpload(commit);
    });

    const checkFailedSurveyImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: null
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyErroredFile,
            payload: "file.txt"
        });
    }

    it("sets data after programme file upload", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadProgram({commit, rootState} as any, mockFormData as any);

        checkProgrammeImportUpload(commit)
    });

    it("sets data after programme file import", async () => {

        mockAxios.onPost(`/adr/programme/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.importProgram({commit, rootState} as any, "some-url");

        checkProgrammeImportUpload(commit)
    });

    const checkProgrammeImportUpload = (commit: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "genericChart/ClearDataset",
            payload: "art"
        });

        expectEqualsFrozen(commit.mock.calls[2][0], {
            type: SurveyAndProgramMutation.ProgramUpdated,
            payload: "TEST"
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[3][0]).toStrictEqual("surveyAndProgram/SelectedDataTypeUpdated");
        expect(commit.mock.calls[3][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Program});
    }

    it("sets error message after failed programme upload", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadProgram({commit, rootState} as any, mockFormData as FormData);

        checkFailedProgramImportUpload(commit);
    });

    it("sets error message after failed programme import", async () => {

        mockAxios.onPost(`/adr/programme/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.importProgram({commit, rootState} as any, "some-url/file.txt");

        checkFailedProgramImportUpload(commit);
    });

    const checkFailedProgramImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toEqual(4);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "genericChart/ClearDataset",
            payload: "art"
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramErroredFile,
            payload: "file.txt"
        });
    }

    it("sets data after anc file upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadANC({commit, rootState} as any, mockFormData as any);

        checkANCImportUpload(commit);
    });

    it("sets data after anc file import", async () => {

        mockAxios.onPost(`/adr/anc/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.importANC({commit, rootState} as any, "some-url");

        checkANCImportUpload(commit);
    });

    const checkANCImportUpload = (commit: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "genericChart/ClearDataset",
            payload: "anc"
        });

        expectEqualsFrozen(commit.mock.calls[2][0], {
            type: SurveyAndProgramMutation.ANCUpdated,
            payload: "TEST"
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[3][0]).toStrictEqual("surveyAndProgram/SelectedDataTypeUpdated");
        expect(commit.mock.calls[3][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.ANC});
    }

    it("sets error message after failed anc upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadANC({commit, rootState} as any, mockFormData as any);

        checkFailedANCImportUpload(commit);
    });

    it("sets error message after failed anc import", async () => {

        mockAxios.onPost(`/adr/anc/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.importANC({commit, rootState} as any, "some-url/file.txt");

        checkFailedANCImportUpload(commit);
    });

    const checkFailedANCImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toEqual(4);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "genericChart/ClearDataset",
            payload: "anc"
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCErroredFile,
            payload: "file.txt"
        });
    }

    it("gets data, commits it and marks state ready", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(200, mockSuccess(mockSurveyResponse()));

        mockAxios.onGet(`/disease/programme/`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/`)
            .reply(200, mockSuccess(mockAncResponse()));

        const commit = jest.fn();
        await actions.getSurveyAndProgramData({commit, rootState} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(SurveyAndProgramMutation.SurveyUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.ProgramUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.ANCUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(4);
        //ready payload is true, which is frozen by definition

    });

    it("it validates, commits and marks state ready", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(200, mockSuccess(mockSurveyResponse()));

        mockAxios.onGet(`/disease/programme/`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/`)
            .reply(200, mockSuccess(mockAncResponse()));

        const commit = jest.fn();
        await actions.validateSurveyAndProgramData({commit, rootState} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(SurveyAndProgramMutation.SurveyUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.ProgramUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.ANCUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.Ready);
        expect(commit.mock.calls[3][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Survey});

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(5);
        //ready payload is true, which is frozen by definition

    });

    it("it runs validation, fails one and commits correctly", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(500, mockFailure("Error message"));

        mockAxios.onGet(`/disease/programme/`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/`)
            .reply(200, mockSuccess(mockAncResponse()));

        const commit = jest.fn();
        await actions.validateSurveyAndProgramData({commit, rootState} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(SurveyAndProgramMutation.SurveyError);
        expect(calls).toContain(SurveyAndProgramMutation.ProgramUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.ANCUpdated);
        expect(calls).toContain(SurveyAndProgramMutation.Ready);
        expect(commit.mock.calls[3][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Program});

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(4);
        //ready payload is true, which is frozen by definition

    });

    it("it runs validation, fails all and commits correctly", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(500, mockFailure("Failed"));

        mockAxios.onGet(`/disease/programme/`)
            .reply(500, mockFailure("Failed"));

        mockAxios.onGet(`/disease/anc/`)
            .reply(500, mockFailure("Failed"));

        const commit = jest.fn();
        await actions.validateSurveyAndProgramData({commit, rootState} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(SurveyAndProgramMutation.SurveyError);
        expect(calls).toContain(SurveyAndProgramMutation.ProgramError);
        expect(calls).toContain(SurveyAndProgramMutation.ANCError);
        expect(calls).toContain(SurveyAndProgramMutation.Ready);
        expect(commit.mock.calls[3][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: null});

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(2);
        //ready payload is true, which is frozen by definition

    });


    it("fails silently and marks state ready if getting data fails", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(500);

        mockAxios.onGet(`/disease/anc/`)
            .reply(500);

        mockAxios.onGet(`/disease/programme/`)
            .reply(500);

        const commit = jest.fn();
        await actions.getSurveyAndProgramData({commit, rootState} as any);

        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.Ready);
    });

    it("deletes survey", async () => {
        mockAxios.onDelete("/disease/survey/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        await actions.deleteSurvey({commit, rootState} as any);
        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.SurveyUpdated);
    });

    it("deletes program", async () => {
        mockAxios.onDelete("/disease/programme/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        await actions.deleteProgram({commit, rootState} as any);
        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ProgramUpdated);
        expect(commit.mock.calls[1][0]).toEqual({
            type: "genericChart/ClearDataset",
            payload: "art"
        });
    });

    it("deletes ANC", async () => {
        mockAxios.onDelete("/disease/anc/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        await actions.deleteANC({commit, rootState} as any);
        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ANCUpdated);
        expect(commit.mock.calls[1][0]).toEqual({
            type: "genericChart/ClearDataset",
            payload: "anc"
        });
    });

    it("deletes all", async () => {
        mockAxios.onDelete("/disease/anc/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/survey/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/programme/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        await actions.deleteAll({commit, rootState} as any);
        expect(mockAxios.history["delete"].length).toBe(3);
        expect(commit).toBeCalledTimes(5);
        expect(commit.mock.calls.map(c => c[0]["type"])).toEqual([
            SurveyAndProgramMutation.SurveyUpdated,
            SurveyAndProgramMutation.ProgramUpdated,
            "genericChart/ClearDataset",
            SurveyAndProgramMutation.ANCUpdated,
            "genericChart/ClearDataset"
        ]);
    });

    it("selects data type", () => {
        const commit = jest.fn();
        actions.selectDataType({commit} as any, DataType.ANC);
        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]).toEqual("surveyAndProgram/SelectedDataTypeUpdated");
        expect(commit.mock.calls[0][1]["type"]).toBe(SurveyAndProgramMutation.SelectedDataTypeUpdated);
        expect(commit.mock.calls[0][1]["payload"]).toBe(DataType.ANC);
    });

});
