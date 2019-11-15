import {actions} from "../../app/store/surveyAndProgram/actions";
import {actions as baselineActions} from "../../app/store/baseline/actions"
import {login} from "./integrationTest";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../app/generated";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and programme actions", () => {

    beforeAll(async () => {
        await login();

        const commit = jest.fn();
        const dispatch = jest.fn();
        const file = fs.createReadStream("../testdata/malawi.geojson");
        const formData = new FormData();
        formData.append('file', file);

        await baselineActions.uploadShape({commit, dispatch} as any, formData);
    });

    function getFormData(fileName: string): FormData {
        const file = fs.createReadStream(`../testdata/${fileName}`);
        const formData = new FormData();
        formData.append('file', file);
        return formData
    }

    it("can upload survey", async () => {

        const commit = jest.fn();
        const dispatch = jest.fn();

        const formData = getFormData("survey.csv");

        await actions.uploadSurvey({commit, dispatch} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("SurveyUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("survey.csv")
    });

    it("can upload programme", async () => {

        const commit = jest.fn();
        const dispatch = jest.fn();

        const formData = getFormData("programme.csv");

        await actions.uploadProgram({commit, dispatch} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("ProgramUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("programme.csv")
    });

    it("can upload anc", async () => {

        const commit = jest.fn();
        const formData = getFormData("anc.csv");

        await actions.uploadANC({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("ANCUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("anc.csv");

    });

    it("can delete survey", async () => {
        const commit = jest.fn();

        const formData = getFormData("survey.csv");

        // upload
        await actions.uploadSurvey({commit} as any, formData);
        const hash = (commit.mock.calls[1][0]["payload"] as SurveyResponse).hash;

        commit.mockReset();

        // delete
        const state = {survey: {hash: hash}};
        await actions.deleteSurvey({commit, state} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("SurveyUpdated");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, state} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == "SurveyUpdated")[0]["payload"]).toBe(null);
    });

    it("can delete program", async () => {
        const commit = jest.fn();

        const formData = getFormData("programme.csv");

        // upload
        await actions.uploadProgram({commit} as any, formData);
        const hash = (commit.mock.calls[1][0]["payload"] as ProgrammeResponse).hash;

        commit.mockReset();

        // delete
        const state = {program: {hash: hash}};
        await actions.deleteProgram({commit, state} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ProgramUpdated");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, state} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == "ProgramUpdated")[0]["payload"]).toBe(null);
    });

    it("can delete ANC", async () => {
        const commit = jest.fn();

        const formData = getFormData("anc.csv");

        // upload
        await actions.uploadANC({commit} as any, formData);
        const hash = (commit.mock.calls[1][0]["payload"] as AncResponse).hash;

        commit.mockReset();

        // delete
        const state = {anc: {hash: hash}};
        await actions.deleteANC({commit, state} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ANCUpdated");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getSurveyAndProgramData({commit, state} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == "ANCUpdated")[0]["payload"]).toBe(null);
    });

});
