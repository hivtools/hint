import {actions} from "../../app/store/surveyAndProgram/actions";
import {actions as baselineActions} from "../../app/store/baseline/actions"
import {login, rootState} from "./integrationTest";
import {getFormData} from "./helpers";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";

describe("Survey and programme actions", () => {

    beforeAll(async () => {
        await login();

        const commit = vi.fn();
        const dispatch = vi.fn();
        const formData = getFormData("malawi.geojson");
        await baselineActions.uploadShape({commit, dispatch, rootState} as any, formData);

        const state = {country: "Malawi"} as any;
        const pjnzFormData = getFormData("Malawi2024.PJNZ");
        await baselineActions.uploadPJNZ({commit, state, dispatch, rootState} as any, pjnzFormData);
    });

    it("can upload survey", async () => {

        const commit = vi.fn();
        const dispatch = vi.fn();

        const formData = getFormData("survey.csv");

        await actions.uploadSurvey({commit, dispatch, rootState} as any, formData);

        expect(dispatch.mock.calls[0][0]).toBe("setSurveyResponse");
        expect(dispatch.mock.calls[0][1]["filename"]).toBe("survey.csv");

        expect(commit.mock.calls[2][0]["type"]).toBe(SurveyAndProgramMutation.WarningsFetched);
    });

    it("can upload programme", async () => {

        const commit = vi.fn();
        const dispatch = vi.fn();

        const formData = getFormData("programme.csv");

        await actions.uploadProgram({commit, dispatch, rootState} as any, formData);

        expect(commit.mock.calls[2][0]["type"]).toBe("reviewInput/ClearDataset");
        expect(commit.mock.calls[2][0]["payload"]).toBe("programme");

        expect(dispatch.mock.calls[0][0]).toBe("setProgramResponse");
        expect(dispatch.mock.calls[0][1]["filename"]).toBe("programme.csv");

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });

        expect(commit.mock.calls[4][0]["type"]).toBe(SurveyAndProgramMutation.WarningsFetched);
    });

    it("can upload anc", async () => {

        const commit = vi.fn();
        const dispatch = vi.fn();
        const formData = getFormData("anc.csv");

        await actions.uploadANC({commit, rootState, dispatch} as any, formData);
        expect(commit.mock.calls[2][0]["type"]).toBe("reviewInput/ClearDataset");
        expect(commit.mock.calls[2][0]["payload"]).toBe("anc");

        expect(dispatch.mock.calls[0][0]).toBe("setAncResponse");
        expect(dispatch.mock.calls[0][1]["filename"]).toBe("anc.csv");

        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "reviewInput/ClearInputComparison"
        });

        expect(commit.mock.calls[4][0]["type"]).toBe(SurveyAndProgramMutation.WarningsFetched);
    });

    it("can upload VMMC", async () => {
        const commit = vi.fn();

        const formData = getFormData("vmmc.xlsx");

        await actions.uploadVmmc({commit, rootState} as any, formData);

        expect(commit.mock.calls[3][0]["type"]).toBe(SurveyAndProgramMutation.VmmcUpdated);
        expect(commit.mock.calls[3][0]["payload"]["filename"])
            .toBe("vmmc.xlsx")
        expect(commit.mock.calls[4][0]["type"]).toBe(SurveyAndProgramMutation.WarningsFetched);
    });

    it("can delete survey", async () => {
        const commit = vi.fn();
        const dispatch = vi.fn();

        const formData = getFormData("survey.csv");

        // upload
        await actions.uploadSurvey({commit, rootState, dispatch} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteSurvey({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.SurveyUpdated);

        dispatch.mockReset();

        // if the file has been deleted, data should come back null so action not dispatched
        await actions.getSurveyAndProgramData({commit, rootState, dispatch} as any);
        expect(dispatch.mock.calls.find(c => c[0] == "setSurveyResponse")).toBeUndefined();
    });

    it("can delete program", async () => {
        const commit = vi.fn();
        const dispatch = vi.fn();

        const formData = getFormData("programme.csv");

        // upload
        await actions.uploadProgram({commit, rootState, dispatch} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteProgram({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ProgramUpdated);
        expect(commit.mock.calls[1][0]["type"]).toBe("reviewInput/ClearDataset");

        dispatch.mockReset();

        // if the file has been deleted, data should come back null and so action not triggered
        await actions.getSurveyAndProgramData({commit, rootState, dispatch} as any);
        expect(dispatch.mock.calls.find(c => c[0] == "setProgramResponse")).toBeUndefined();
    });

    it("can delete ANC", async () => {
        const commit = vi.fn();
        const dispatch = vi.fn();

        const formData = getFormData("anc.csv");

        // upload
        await actions.uploadANC({commit, rootState, dispatch} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteANC({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ANCUpdated);
        expect(commit.mock.calls[1][0]["type"]).toBe("reviewInput/ClearDataset");

        dispatch.mockReset();

        // if the file has been deleted, data should come back null and so action not triggered
        await actions.getSurveyAndProgramData({commit, rootState, dispatch} as any);
        expect(dispatch.mock.calls.find(c => c[0] == "setAncResponse")).toBeUndefined();
    });

    it("can delete VMMC", async () => {
        const commit = vi.fn();
        const dispatch = vi.fn()

        const formData = getFormData("vmmc.xlsx");

        // upload
        await actions.uploadVmmc({commit, rootState} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteVmmc({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.VmmcUpdated);
        expect(commit.mock.calls[1][0]["type"]).toBe("reviewInput/ClearDataset");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, dispatch, rootState} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == SurveyAndProgramMutation.VmmcUpdated)[0]["payload"]).toBe(null);
    });
});
