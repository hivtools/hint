import {actions} from "../../app/store/surveyAndProgram/actions";
import {
    mockAncResponse,
    mockAxios,
    mockFailure,
    mockProgramResponse,
    mockSuccess,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";

import {DataType} from "../../app/store/filteredData/filteredData";

const FormData = require("form-data");

describe("Survey and programme actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets data and gets model options after survey file upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(200, mockSuccess({data: "SOME DATA"}));

        mockAxios.onGet("/model/options/")
            .reply(200, mockSuccess("TESTOPTIONS"));

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

        expect(commit.mock.calls[3][0]).toBe("modelOptions/FormMetaUpdated");
        expect(commit.mock.calls[3][1]).toStrictEqual({payload: "TESTOPTIONS", type: "FormMetaUpdated"});
        expect(commit.mock.calls[3][2]).toStrictEqual({root: true});
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

        //Should not have set selectedDataType or fetched options
        expect(commit.mock.calls.length).toEqual(2);
    });

    it("sets data after programme file upload", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState();
        await actions.uploadProgram({commit, state} as any, new FormData());

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

        // Should not have fetched model options
        expect(commit.mock.calls.length).toBe(3);
    });


    it("gets model options after uploading programme if survey is already present", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(200, mockSuccess("TEST"));

        mockAxios.onGet("/model/options/")
            .reply(200, mockSuccess("TESTOPTIONS"));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        });
        await actions.uploadProgram({commit, state} as any, new FormData());

        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[3][0]).toBe("modelOptions/FormMetaUpdated");
        expect(commit.mock.calls[3][1]).toStrictEqual({payload: "TESTOPTIONS", type: "FormMetaUpdated"});
        expect(commit.mock.calls[3][2]).toStrictEqual({root: true});
    });


    it("sets error message after failed programme upload", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState();
        await actions.uploadProgram({commit, state} as any, new FormData());

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
        const state = mockSurveyAndProgramState();
        await actions.uploadANC({commit, state} as any, new FormData());

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

        // Should not have fetched model options
        expect(commit.mock.calls.length).toBe(3);
    });


    it("gets model options after uploading anc if survey is already present", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(200, mockSuccess("TEST"));

        mockAxios.onGet("/model/options/")
            .reply(200, mockSuccess("TESTOPTIONS"));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        });
        await actions.uploadANC({commit, state} as any, new FormData());

        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[3][0]).toBe("modelOptions/FormMetaUpdated");
        expect(commit.mock.calls[3][1]).toStrictEqual({payload: "TESTOPTIONS", type: "FormMetaUpdated"});
        expect(commit.mock.calls[3][2]).toStrictEqual({root: true});
    });

    it("sets error message after failed anc upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState();
        await actions.uploadANC({commit, state} as any, new FormData());

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

    it("gets data and model options, commits it and marks state ready", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(200, mockSuccess(mockSurveyResponse()));

        mockAxios.onGet(`/disease/programme/`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/`)
            .reply(200, mockSuccess(mockAncResponse()));

        mockAxios.onGet("/model/options/")
            .reply(200, mockSuccess("TEST" as any));

        const commit = jest.fn();
        await actions.getSurveyAndProgramData({commit} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain("SurveyUpdated");
        expect(calls).toContain("ProgramUpdated");
        expect(calls).toContain("ANCUpdated");
        expect(calls).toContain("Ready");

        expect(commit.mock.calls[3][0]).toBe("modelOptions/FormMetaUpdated");
    });

    it("fails silently and marks state ready if getting data fails", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(500);

        mockAxios.onGet(`/disease/anc/`)
            .reply(500);

        mockAxios.onGet(`/disease/programme/`)
            .reply(500);

        mockAxios.onGet("/model/options/")
            .reply(200, mockSuccess("TEST" as any));

        const commit = jest.fn();
        await actions.getSurveyAndProgramData({commit} as any);

        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]).toBe("modelOptions/FormMetaUpdated");
        expect(commit.mock.calls[1][0]["type"]).toContain("Ready");
        expect(mockAxios.history.get.length).toBe(4);
    });

});
