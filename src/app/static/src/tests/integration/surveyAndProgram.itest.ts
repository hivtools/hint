import {actions} from "../../app/store/surveyAndProgram/actions";
import {DataType} from "../../app/store/filteredData/filteredData";

const fs = require("fs");
const FormData = require("form-data");

describe("Survey and program actions", () => {

    it("can upload surveys", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/survey.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadSurvey({commit} as any, formData);


        expect(commit.mock.calls[1][0]["type"]).toBe("SurveyLoaded");
        expectSelectedDataTypeUpdate(commit.mock.calls[2], DataType.Survey);
    });

    it("can upload program", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/programme.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadProgram({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("ProgramLoaded");
        expectSelectedDataTypeUpdate(commit.mock.calls[2], DataType.Program);
    });

    it("can upload anc", async () => {

        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/anc.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadANC({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("ANCLoaded");
        expectSelectedDataTypeUpdate(commit.mock.calls[2], DataType.ANC);
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
