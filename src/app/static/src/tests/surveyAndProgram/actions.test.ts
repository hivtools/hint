import {actions} from "../../app/store/surveyAndProgram/actions";
import {mockAxios, mockFailure, mockSuccess} from "../mocks";
import {DataType} from "../../app/store/filteredData/filteredData";

const FormData = require("form-data");

describe("Survey and program actions", () => {

    it("sets data after surveys file upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(200, mockSuccess({data: "SOME DATA"}));

        const commit = jest.fn();
        await actions.uploadSurvey({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "SurveyUpdated",
            payload: {data: "SOME DATA"}
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Survey});
    });

    it("sets error message after failed surveys upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadSurvey({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyUpdated",
            payload: null
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "SurveyError",
            payload: "error message"
        });

        //Should not have set selectedDataType
        expect(commit.mock.calls.length).toEqual(2);
    });

    it("sets data after program file upload", async () => {

        mockAxios.onPost(`/disease/program/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadProgram({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ProgramUpdated",
            payload: "TEST"
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Program});
    });

    it("sets error message after failed program upload", async () => {

        mockAxios.onPost(`/disease/program/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadProgram({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ProgramError",
            payload: "error message"
        });

        //Should not have set selectedDataType
        expect(commit.mock.calls.length).toEqual(2);
    });

    it("sets data after anc file upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadANC({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ANCUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ANCUpdated",
            payload: "TEST"
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.ANC});
    });

    it("sets error message after failed anc upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadANC({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ANCUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ANCError",
            payload: "error message"
        });

        //Should not have set selectedDataType
        expect(commit.mock.calls.length).toEqual(2);
    });

});