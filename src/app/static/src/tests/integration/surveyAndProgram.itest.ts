import {actions} from "../../app/store/surveyAndProgram/actions";
import {DataType} from "../../app/main";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and program actions", () => {

    beforeEach(() => {
        fs.writeFileSync("fakefile");
    });

    afterEach(() => {
        fs.unlinkSync("fakefile")
    });

    it("can upload survey", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("fakefile");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadSurvey({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyError",
            payload: "could not find function \"validate_func\""
        });

        expect(commit.mock.calls[0][1]).toStrictEqual({
            type: "SelectedDataTypeUpated",
            payload: DataType.Survey
        });
    });

    it("can upload program", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("fakefile");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadProgram({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramError",
            payload: "could not find function \"validate_func\""
        });

        expect(commit.mock.calls[0][1]).toStrictEqual({
            type: "SelectedDataTypeUpated",
            payload: DataType.Survey
        });
    });

    it("can upload anc", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("fakefile");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadANC({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ANCError",
            payload: "cannot open the connection"
        });

        expect(commit.mock.calls[0][1]).toStrictEqual({
            type: "SelectedDataTypeUpated",
            payload: DataType.Survey
        });
    });

});
