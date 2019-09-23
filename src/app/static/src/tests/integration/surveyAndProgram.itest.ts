import {actions} from "../../app/store/surveyAndProgram/actions";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and program actions", () => {

    it("can upload surveys", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/survey.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadSurvey({commit} as any, formData);

        // Unfortunately we can't test the success path because it relies on a persistent
        // session between uploading a shape file and a survey file. But the success path is
        // under test in the unit tests
        expect(commit.mock.calls[1][0]["type"]).toBe("SurveyError");
        expect(commit.mock.calls[1][0]["payload"])
            .toBe("You must upload a shape file before uploading survey or programme data")

    });

    it("can upload program", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/programme.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadProgram({commit} as any, formData);

        // Unfortunately we can't test the success path because it relies on a persistent
        // session between uploading a shape file and a program file. But the success path is
        // under test in the unit tests
        expect(commit.mock.calls[1][0]["type"]).toBe("ProgramError");
        expect(commit.mock.calls[1][0]["payload"])
            .toBe("You must upload a shape file before uploading survey or programme data")
    });

    it("can upload anc", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/anc.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadANC({commit} as any, formData);

        // Unfortunately we can't test the success path because it relies on a persistent
        // session between uploading a shape file and an anc file. But the success path is
        // under test in the unit tests
        expect(commit.mock.calls[1][0]["type"]).toBe("ANCError");
        expect(commit.mock.calls[1][0]["payload"])
            .toBe("You must upload a shape file before uploading survey or programme data")
    });

});
