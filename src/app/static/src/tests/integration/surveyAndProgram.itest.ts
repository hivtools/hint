import {actions} from "../../app/store/surveyAndProgram/actions";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and program actions", () => {

    it("can upload survey", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/survey.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadSurvey({commit} as any, formData);
        expect(commit.mock.calls[0][0]["type"]).toBe("SurveyLoaded");
    });

    it("can upload program", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/programme.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadProgram({commit} as any, formData);
        expect(commit.mock.calls[0][0]["type"]).toBe("ProgramLoaded");
    });

    it("can upload anc", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/anc.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadANC({commit} as any, formData);
        expect(commit.mock.calls[0][0]["type"]).toBe("ANCLoaded");
    });

});
