import {actions} from "../../app/store/surveyAndProgram/actions";
import {actions as baselineActions} from "../../app/store/baseline/actions"
import {login, rootState} from "./integrationTest";
import {getFormData} from "./helpers";
import {SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";

describe("Survey and programme actions", () => {

    beforeAll(async () => {
        await login();

        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("malawi.geojson");

        await baselineActions.uploadShape({commit, dispatch, rootState} as any, formData);
    });

    it("can upload survey", async () => {

        const commit = jest.fn();
        const dispatch = jest.fn();

        const formData = getFormData("survey.csv");

        await actions.uploadSurvey({commit, dispatch, rootState} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe(SurveyAndProgramMutation.SurveyUpdated);
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("survey.csv")
    });

    it("can upload programme", async () => {

        const commit = jest.fn();
        const dispatch = jest.fn();

        const formData = getFormData("programme.csv");

        await actions.uploadProgram({commit, dispatch, rootState} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("genericChart/ClearDataset");
        expect(commit.mock.calls[2][0]["type"]).toBe(SurveyAndProgramMutation.ProgramUpdated);
        expect(commit.mock.calls[2][0]["payload"]["filename"])
            .toBe("programme.csv")
    });

    it("can upload anc", async () => {

        const commit = jest.fn();
        const formData = getFormData("anc.csv");

        await actions.uploadANC({commit, rootState} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("genericChart/ClearDataset");
        expect(commit.mock.calls[2][0]["type"]).toBe(SurveyAndProgramMutation.ANCUpdated);
        expect(commit.mock.calls[2][0]["payload"]["filename"])
            .toBe("anc.csv");
    });

    it("can delete survey", async () => {
        const commit = jest.fn();

        const formData = getFormData("survey.csv");

        // upload
        await actions.uploadSurvey({commit, rootState} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteSurvey({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.SurveyUpdated);

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, rootState} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == SurveyAndProgramMutation.SurveyUpdated)[0]["payload"]).toBe(null);
    });

    it("can delete program", async () => {
        const commit = jest.fn();

        const formData = getFormData("programme.csv");

        // upload
        await actions.uploadProgram({commit, rootState} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteProgram({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ProgramUpdated);
        expect(commit.mock.calls[1][0]["type"]).toBe("genericChart/ClearDataset");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, rootState} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == SurveyAndProgramMutation.ProgramUpdated)[0]["payload"]).toBe(null);
    });

    it("can delete ANC", async () => {
        const commit = jest.fn();

        const formData = getFormData("anc.csv");

        // upload
        await actions.uploadANC({commit, rootState} as any, formData);

        commit.mockReset();

        // delete
        await actions.deleteANC({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(SurveyAndProgramMutation.ANCUpdated);
        expect(commit.mock.calls[1][0]["type"]).toBe("genericChart/ClearDataset");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, rootState} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == SurveyAndProgramMutation.ANCUpdated)[0]["payload"]).toBe(null);
    });

});
