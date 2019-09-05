import {actions} from "../../app/store/surveyAndProgram/actions";
import {DataType} from "../../app/store/filteredData/filteredData";

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
            payload: "File does not exist. Create it, or fix the path."
        });

        //expectSelectedDataTypeUpdate(commit.mock.calls[1], DataType.Survey);

    });

    it("can upload program", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("fakefile");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadProgram({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramError",
            payload: "File does not exist. Create it, or fix the path."
        });

        //expectSelectedDataTypeUpdate(commit.mock.calls[1], DataType.Program);
    });

    it("can upload anc", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("fakefile");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadANC({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ANCError",
            payload: "File does not exist. Create it, or fix the path."
        });

        //expectSelectedDataTypeUpdate(commit.mock.calls[1], DataType.ANC);
    });

    function expectSelectedDataTypeUpdate(params: any[], dataType: DataType){
        expect(params[0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(params[1]).toStrictEqual({
            type: "SelectedDataTypeUpdated",
            payload: dataType
        });
        expect(params[2]).toStrictEqual({root: true});
    }

});
