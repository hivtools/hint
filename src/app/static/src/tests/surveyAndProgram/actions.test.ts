import {actions} from "../../app/store/surveyAndProgram/actions";
import {
    mockAncData,
    mockAncResponse,
    mockAxios,
    mockBaselineState,
    mockError,
    mockFailure,
    mockProgramData,
    mockProgramResponse,
    mockRootState,
    mockShapeResponse,
    mockSuccess,
    mockSurveyAndProgramState,
    mockSurveyData,
    mockSurveyResponse,
    mockVmmcResponse
} from "../mocks";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {expectEqualsFrozen} from "../testHelpers";
import {FileType} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {expectValidAdrImportPayload} from "../baseline/actions.test";
import {Mock} from "vitest";

const rootState = mockRootState();
const mockFormData = {
    get: (key: string) => {
        return key == "file" ? {name: "file.txt"} : null;
    }
};

const root = (resource: object) => {
    return mockRootState({baseline: ({selectedDataset: {id: "1", resources: resource}} as any)})
}

describe("Survey and programme actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = vi.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as Mock).mockClear();
    });

    it("sets data after surveys file upload", async () => {

        mockAxios.onPost(`/disease/survey/?strict=true`)
            .reply(200, mockSuccess({data: "SOME DATA", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.uploadSurvey({commit, rootState, dispatch} as any, mockFormData as any);

        checkSurveyImportUpload(commit, dispatch);
    });

    it("sets data after surveys file import", async () => {
        const url = "/adr/survey/?strict=true"
        mockAxios.onPost(url)
            .reply(200, mockSuccess({data: "SOME DATA", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.importSurvey({commit, dispatch, rootState: root({survey: {id: "123"}})} as any, "some-url");

        expectValidAdrImportPayload(url)

        checkSurveyImportUpload(commit, dispatch);
    });

    const checkSurveyImportUpload = (commit: Mock, dispatch: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Survey, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "WarningsFetched",
            payload: {type: FileType.Survey, warnings: "TEST WARNINGS"}
        });

        expect(dispatch.mock.calls[0][0]).toStrictEqual("setSurveyResponse");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({data: "SOME DATA", warnings: "TEST WARNINGS"})
    }

    it("sets error message after failed surveys upload", async () => {

        mockAxios.onPost(`/disease/survey/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.uploadSurvey({commit, rootState} as any, mockFormData as FormData);

        checkFailedSurveyImportUpload(commit);
    });

    it("sets error message after failed surveys import", async () => {

        mockAxios.onPost(`/adr/survey/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.importSurvey({commit, rootState} as any, "some-url/file.txt");

        checkFailedSurveyImportUpload(commit);
    });

    const checkFailedSurveyImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Survey, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: SurveyAndProgramMutation.SurveyErroredFile,
            payload: "file.txt"
        });
    }

    it("sets data after programme file upload", async () => {

        mockAxios.onPost(`/disease/programme/?strict=true`)
            .reply(200, mockSuccess({data: "TEST", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.uploadProgram({commit, rootState, dispatch} as any, mockFormData as any);

        checkProgrammeImportUpload(commit, dispatch)
    });

    it("sets data after programme file import", async () => {
        const url = "/adr/programme/?strict=true"
        mockAxios.onPost(url)
            .reply(200, mockSuccess({data: "TEST", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.importProgram({commit, rootState: root({program: {id: "123"}}), dispatch} as any, "some-url");

        expectValidAdrImportPayload(url)

        checkProgrammeImportUpload(commit, dispatch)
    });

    it("does not call import programme if url is missing", async () => {
        const commit = vi.fn();
        await actions.importProgram({commit, rootState} as any, "");

        expect(commit.mock.calls.length).toBe(0);
    });

    it("does not call import survey if url is missing", async () => {
        const commit = vi.fn();
        await actions.importSurvey({commit, rootState} as any, "");

        expect(commit.mock.calls.length).toBe(0);
    });

    it("does not call import ANC if url is missing", async () => {
        const commit = vi.fn();
        await actions.importANC({commit, rootState} as any, "");

        expect(commit.mock.calls.length).toBe(0);
    });

    it("does not call import VMMC if url is missing", async () => {
        const commit = vi.fn();
        await actions.importVmmc({commit, rootState} as any, "");

        expect(commit.mock.calls.length).toBe(0);
    });

    const checkProgrammeImportUpload = (commit: Mock, dispatch: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Programme, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearDataset",
            payload: "art"
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });

        expect(commit.mock.calls[4][0]).toStrictEqual(
            {
                type: "WarningsFetched",
                payload: {type: FileType.Programme, warnings: "TEST WARNINGS"}
            });

        expect(dispatch.mock.calls[0][0]).toStrictEqual("setProgramResponse");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({data: "TEST", warnings: "TEST WARNINGS"})
    }

    it("sets error message after failed programme upload", async () => {

        mockAxios.onPost(`/disease/programme/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.uploadProgram({commit, rootState} as any, mockFormData as FormData);

        checkFailedProgramImportUpload(commit);
    });

    it("sets error message after failed programme import", async () => {

        mockAxios.onPost(`/adr/programme/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.importProgram({commit, rootState} as any, "some-url/file.txt");

        checkFailedProgramImportUpload(commit);
    });

    const checkFailedProgramImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toEqual(6);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Programme, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearDataset",
            payload: "art"
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });

        expect(commit.mock.calls[4][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[5][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ProgramErroredFile,
            payload: "file.txt"
        });
    }

    it("sets data after anc file upload", async () => {

        mockAxios.onPost(`/disease/anc/?strict=true`)
            .reply(200, mockSuccess({data: "TEST", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.uploadANC({commit, rootState, dispatch} as any, mockFormData as any);

        checkANCImportUpload(commit, dispatch);
    });

    it("sets data after anc file import", async () => {
        const url = "/adr/anc/?strict=true"
        mockAxios.onPost(url)
            .reply(200, mockSuccess({data: "TEST", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        const dispatch = vi.fn();

        await actions.importANC({commit, rootState: root({anc: {id: "123"}}), dispatch} as any, "some-url");

        expectValidAdrImportPayload(url)

        checkANCImportUpload(commit, dispatch);
    });

    const checkANCImportUpload = (commit: Mock, dispatch: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.ANC, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearDataset",
            payload: "anc"
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });

        expect(commit.mock.calls[4][0]).toStrictEqual(
            {
                type: "WarningsFetched",
                payload: {type: FileType.ANC, warnings: "TEST WARNINGS"}
            });

        expect(dispatch.mock.calls[0][0]).toStrictEqual("setAncResponse");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({data: "TEST", warnings: "TEST WARNINGS"})
    }

    it("sets error message after failed anc upload", async () => {

        mockAxios.onPost(`/disease/anc/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.uploadANC({commit, rootState} as any, mockFormData as any);

        checkFailedANCImportUpload(commit);
    });

    it("sets error message after failed anc import", async () => {

        mockAxios.onPost(`/adr/anc/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.importANC({commit, rootState} as any, "some-url/file.txt");

        checkFailedANCImportUpload(commit);
    });

    const checkFailedANCImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toEqual(6);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.ANC, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearDataset",
            payload: "anc"
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });

        expect(commit.mock.calls[4][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[5][0]).toStrictEqual({
            type: SurveyAndProgramMutation.ANCErroredFile,
            payload: "file.txt"
        });
    }

    it("sets data after vmmc file upload", async () => {

        mockAxios.onPost(`/disease/vmmc/?strict=true`)
            .reply(200, mockSuccess({data: "TEST", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();
        await actions.uploadVmmc({commit, rootState} as any, mockFormData as any);

        checkVmmcImportUpload(commit);
    });

    it("sets data after vmmc file import", async () => {
        const url = "/adr/vmmc/?strict=true"
        mockAxios.onPost(url)
            .reply(200, mockSuccess({data: "TEST", warnings: "TEST WARNINGS"}));

        const commit = vi.fn();

        await actions.importVmmc({commit, rootState: root({vmmc: {id: "123"}})} as any, "some-url");

        expectValidAdrImportPayload(url)

        checkVmmcImportUpload(commit);
    });

    const checkVmmcImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toBe(5);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.VmmcUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Vmmc, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearDataset",
            payload: "vmmc"
        });

        expectEqualsFrozen(commit.mock.calls[3][0], {
            type: SurveyAndProgramMutation.VmmcUpdated,
            payload: {data: "TEST", warnings: "TEST WARNINGS"}
        });

        expect(commit.mock.calls[4][0]).toStrictEqual(
            {
                type: "WarningsFetched",
                payload: {type: FileType.Vmmc, warnings: "TEST WARNINGS"}
            });
    }

    it("sets error message after failed vmmc upload", async () => {

        mockAxios.onPost(`/disease/vmmc/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.uploadVmmc({commit, rootState} as any, mockFormData as any);

        checkFailedVmmcImportUpload(commit);
    });

    it("sets error message after failed vmmc import", async () => {

        mockAxios.onPost(`/adr/vmmc/?strict=true`)
            .reply(500, mockFailure("error message"));

        const commit = vi.fn();
        await actions.importVmmc({commit, rootState} as any, "some-url/file.txt");

        checkFailedVmmcImportUpload(commit);
    });

    const checkFailedVmmcImportUpload = (commit: Mock) => {
        expect(commit.mock.calls.length).toEqual(5);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: SurveyAndProgramMutation.VmmcUpdated,
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Vmmc, warnings: []}
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearDataset",
            payload: "vmmc"
        });

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: SurveyAndProgramMutation.VmmcError,
            payload: mockError("error message")
        });

        expect(commit.mock.calls[4][0]).toStrictEqual({
            type: SurveyAndProgramMutation.VmmcErroredFile,
            payload: "file.txt"
        });
    }

    it("gets data, commits it and marks state ready", async () => {

        mockAxios.onGet(`/disease/survey/?strict=true`)
            .reply(200, mockSuccess(mockSurveyResponse()));

        mockAxios.onGet(`/disease/programme/?strict=true`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/?strict=true`)
            .reply(200, mockSuccess(mockAncResponse()));

        mockAxios.onGet(`/disease/vmmc/?strict=true`)
            .reply(200, mockSuccess(mockVmmcResponse()));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.getSurveyAndProgramData({commit, rootState, dispatch} as any);

        const commitCalls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        const dispatchCalls = dispatch.mock.calls.map((callArgs) => callArgs[0]);
        expect(dispatchCalls).toContain("setSurveyResponse");
        expect(dispatchCalls).toContain("setProgramResponse");
        expect(dispatchCalls).toContain("setAncResponse");
        expect(commitCalls).toContain(SurveyAndProgramMutation.VmmcUpdated);
        expect(commitCalls).toContain(SurveyAndProgramMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        // ready payload is true, which is frozen by definition
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(2);
    });

    it("it validates, commits and marks state ready", async () => {

        mockAxios.onGet(`/disease/survey/?strict=true`)
            .reply(200, mockSuccess(mockSurveyResponse()));

        mockAxios.onGet(`/disease/programme/?strict=true`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/?strict=true`)
            .reply(200, mockSuccess(mockAncResponse()));

        mockAxios.onGet(`/disease/vmmc/?strict=true`)
            .reply(200, mockSuccess(mockVmmcResponse()));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.validateSurveyAndProgramData({commit, rootState, dispatch} as any);

        const commitCalls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        const dispatchCalls = dispatch.mock.calls.map((callArgs) => callArgs[0]);
        expect(dispatchCalls).toContain("setSurveyResponse");
        expect(dispatchCalls).toContain("setProgramResponse");
        expect(dispatchCalls).toContain("setAncResponse");
        expect(commitCalls).toContain(SurveyAndProgramMutation.VmmcUpdated);
        expect(commitCalls).toContain(SurveyAndProgramMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(2);
        //ready payload is true, which is frozen by definition
    });

    it("it runs validation, fails one and commits correctly", async () => {

        mockAxios.onGet(`/disease/survey/?strict=true`)
            .reply(500, mockFailure("Error message"));

        mockAxios.onGet(`/disease/programme/?strict=true`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/?strict=true`)
            .reply(200, mockSuccess(mockAncResponse()));

        mockAxios.onGet(`/disease/vmmc/?strict=true`)
            .reply(200, mockSuccess(mockVmmcResponse()));

        const commit = vi.fn();
        const dispatch = vi.fn();
        await actions.validateSurveyAndProgramData({commit, rootState, dispatch} as any);

        const commitCalls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        const dispatchCalls = dispatch.mock.calls.map((callArgs) => callArgs[0]);
        expect(commitCalls).toContain(SurveyAndProgramMutation.SurveyError);
        expect(dispatchCalls).not.toContain("setSurveyResponse");
        expect(dispatchCalls).toContain("setProgramResponse");
        expect(dispatchCalls).toContain("setAncResponse");
        expect(commitCalls).toContain(SurveyAndProgramMutation.VmmcUpdated);
        expect(commitCalls).toContain(SurveyAndProgramMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(2);
        //ready payload is true, which is frozen by definition
    });

    it("it runs validation, fails all and commits correctly", async () => {

        mockAxios.onGet(`/disease/survey/?strict=true`)
            .reply(500, mockFailure("Failed"));

        mockAxios.onGet(`/disease/programme/?strict=true`)
            .reply(500, mockFailure("Failed"));

        mockAxios.onGet(`/disease/anc/?strict=true`)
            .reply(500, mockFailure("Failed"));

        mockAxios.onGet(`/disease/vmmc/?strict=true`)
            .reply(500, mockFailure("Failed"));

        const commit = vi.fn();
        await actions.validateSurveyAndProgramData({commit, rootState} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(SurveyAndProgramMutation.SurveyError);
        expect(calls).toContain(SurveyAndProgramMutation.ProgramError);
        expect(calls).toContain(SurveyAndProgramMutation.ANCError);
        expect(calls).toContain(SurveyAndProgramMutation.VmmcError);
        expect(calls).toContain(SurveyAndProgramMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(1);
        //ready payload is true, which is frozen by definition
    });

    it("fails silently and marks state ready if getting data fails", async () => {

        mockAxios.onGet(`/disease/survey/?strict=true`)
            .reply(500);

        mockAxios.onGet(`/disease/anc/?strict=true`)
            .reply(500);

        mockAxios.onGet(`/disease/programme/?strict=true`)
            .reply(500);

        mockAxios.onGet(`/disease/vmmc/?strict=true`)
            .reply(500);

        const commit = vi.fn();
        await actions.getSurveyAndProgramData({commit, rootState} as any);

        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.Ready);
    });

    it("deletes survey", async () => {
        mockAxios.onDelete("/disease/survey/")
            .reply(200, mockSuccess(true));

        const commit = vi.fn();
        await actions.deleteSurvey({
            commit, rootState,
            state: mockSurveyAndProgramState({program: mockProgramResponse()})
        } as any);
        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.SurveyUpdated);
        expect(commit.mock.calls[1][0]).toEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Survey, warnings: []}
        });
    });

    it("deletes program", async () => {
        mockAxios.onDelete("/disease/programme/")
            .reply(200, mockSuccess(true));

        const commit = vi.fn();
        await actions.deleteProgram({
            commit,
            rootState,
            state: mockSurveyAndProgramState({survey: mockSurveyResponse()})
        } as any);
        expect(commit).toBeCalledTimes(4);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ProgramUpdated);
        expect(commit.mock.calls[1][0]).toEqual({
            type: "reviewInput/ClearDataset",
            payload: "art"
        })
        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });
        expect(commit.mock.calls[3][0]).toEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Programme, warnings: []}
        });
    });

    it("deletes ANC and resets selected data type", async () => {
        mockAxios.onDelete("/disease/anc/")
            .reply(200, mockSuccess(true));

        const commit = vi.fn();
        await actions.deleteANC({
            commit,
            rootState,
            state: mockSurveyAndProgramState({program: mockProgramResponse()})
        } as any);
        expect(commit).toBeCalledTimes(4);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ANCUpdated);
        expect(commit.mock.calls[1][0]).toEqual({
            type: "reviewInput/ClearDataset",
            payload: "anc"
        });
        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });
        expect(commit.mock.calls[3][0]).toEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.ANC, warnings: []}
        });
    });

    it("deletes VMMC", async () => {
        mockAxios.onDelete("/disease/vmmc/")
            .reply(200, mockSuccess(true));

        const commit = vi.fn();
        await actions.deleteVmmc({
            commit,
            rootState,
            state: mockSurveyAndProgramState({program: mockProgramResponse()})
        } as any);
        expect(commit).toBeCalledTimes(3);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.VmmcUpdated);
        expect(commit.mock.calls[1][0]).toEqual({
            type: "reviewInput/ClearDataset",
            payload: "vmmc"
        });
        expect(commit.mock.calls[2][0]).toEqual({
            type: SurveyAndProgramMutation.WarningsFetched,
            payload: {type: FileType.Vmmc, warnings: []}
        });
    });

    it("deletes all", async () => {
        mockAxios.onDelete("/disease/anc/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/survey/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/programme/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/vmmc/")
            .reply(200, mockSuccess(true));

        const commit = vi.fn();
        await actions.deleteAll({commit, rootState, state: mockSurveyAndProgramState()} as any);
        expect(mockAxios.history["delete"].length).toBe(4);
        expect(commit).toBeCalledTimes(13);
        expect(commit.mock.calls.map(c => c[0]["type"])).toEqual([
            SurveyAndProgramMutation.SurveyUpdated,
            SurveyAndProgramMutation.WarningsFetched,
            SurveyAndProgramMutation.ProgramUpdated,
            "reviewInput/ClearDataset",
            "reviewInput/ClearInputComparison",
            SurveyAndProgramMutation.WarningsFetched,
            SurveyAndProgramMutation.ANCUpdated,
            "reviewInput/ClearDataset",
            "reviewInput/ClearInputComparison",
            SurveyAndProgramMutation.WarningsFetched,
            SurveyAndProgramMutation.VmmcUpdated,
            "reviewInput/ClearDataset",
            SurveyAndProgramMutation.WarningsFetched
        ]);
    });

    it("commits survey data without area level", () => {
        const commit = vi.fn();
        const surveyData = [mockSurveyData()];
        const surveyResponse = mockSurveyResponse({
            data: surveyData
        });
        actions.setSurveyResponse({commit, rootState} as any, surveyResponse)

        expectEqualsFrozen(commit.mock.calls[0][0], {
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: surveyResponse
        });
    });

    const rootStateWithShapeData = mockRootState({
        baseline: mockBaselineState({
            iso3: "MWI",
            shape: mockShapeResponse({
                data: {
                    "type": "FeatureCollection",
                    "features": [{
                        properties: {
                            area_id: "MWI",
                            area_level: 1
                        }
                    }]
                }
            })
        }),
    })

    it("commits survey data with area level", () => {
        const commit = vi.fn();
        const surveyData = [mockSurveyData()];
        expect(surveyData[0]["area_level"]).toBeUndefined();
        const surveyResponse = mockSurveyResponse({
            data: surveyData
        });
        actions.setSurveyResponse({commit, rootState: rootStateWithShapeData} as any, surveyResponse)

        expectEqualsFrozen(commit.mock.calls[0][0], {
            type: SurveyAndProgramMutation.SurveyUpdated,
            payload: surveyResponse
        });
        expect(surveyResponse.data[0]["area_level"]).toBe(1);
    });

    it("commits programme data with area level", () => {
        const commit = vi.fn();
        const programData = [mockProgramData()];
        expect(programData[0]["area_level"]).toBeUndefined();
        const programResponse = mockProgramResponse({
            data: programData
        });
        actions.setProgramResponse({commit, rootState: rootStateWithShapeData} as any, programResponse)

        expectEqualsFrozen(commit.mock.calls[0][0], {
            type: SurveyAndProgramMutation.ProgramUpdated,
            payload: programResponse
        });
        expect(programResponse.data[0]["area_level"]).toBe(1);
    });

    it("commits ANC data with area level", () => {
        const commit = vi.fn();
        const ancData = [mockAncData()];
        expect(ancData[0]["area_level"]).toBeUndefined();
        const ancResponse = mockAncResponse({
            data: ancData
        });
        actions.setAncResponse({commit, rootState: rootStateWithShapeData} as any, ancResponse)

        expectEqualsFrozen(commit.mock.calls[0][0], {
            type: SurveyAndProgramMutation.ANCUpdated,
            payload: ancResponse
        });
        expect(ancResponse.data[0]["area_level"]).toBe(1);
    });
});
