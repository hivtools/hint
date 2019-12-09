import {
    mockAxios,
    mockBaselineState, mockError,
    mockFailure,
    mockPopulationResponse,
    mockShapeResponse,
    mockSuccess,
    mockValidateBaselineResponse
} from "../mocks";
import {actions} from "../../app/store/baseline/actions";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {expectEqualsFrozen, testUploadErrorCommitted} from "../testHelpers";

const FormData = require("form-data");

describe("Baseline actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets country and iso3 after PJNZ file upload, and fetches plotting metadata, and validates", async () => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi", iso3: "MWI"}}));

        const commit = jest.fn();
        const state = mockBaselineState({iso3: "MWI"});
        const dispatch = jest.fn();
        await actions.uploadPJNZ({commit, state, dispatch} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({type: BaselineMutation.PJNZUpdated, payload: null});

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: BaselineMutation.PJNZUpdated,
            payload: {data: {country: "Malawi", iso3: "MWI"}}
        });

        expect(dispatch.mock.calls.length).toBe(3);

        expect(dispatch.mock.calls[0][0]).toBe("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[0][1]).toBe("MWI");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});

        expect(dispatch.mock.calls[1].length).toBe(1);
        expect(dispatch.mock.calls[1][0]).toBe("validate");

        expect(dispatch.mock.calls[2][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[2][2]).toStrictEqual({root: true});
    });

    it("upload PJNZ does not fetch plotting metadata or validate if error occurs", async () => {
        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState({pjnzError: mockError("test error")});
        const dispatch = jest.fn();
        await actions.uploadPJNZ({commit, state, dispatch} as any, new FormData());

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
    });

    testUploadErrorCommitted("/baseline/pjnz/",
        BaselineMutation.PJNZUploadError,
        BaselineMutation.PJNZUpdated,
        actions.uploadPJNZ);

    it("commits response and validates after shape file upload", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onPost(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.uploadShape({commit, dispatch} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.ShapeUpdated,
            payload: null
        });

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: BaselineMutation.ShapeUpdated,
            payload: mockShape
        });

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("validate");

        expect(dispatch.mock.calls[1][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[1][2]).toStrictEqual({root: true});
    });

    it("commits response and validates after population file upload", async () => {

        const mockPop = mockPopulationResponse();
        mockAxios.onPost(`/baseline/population/`)
            .reply(200, mockSuccess(mockPop));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.uploadPopulation({commit, dispatch} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.PopulationUpdated,
            payload: null
        });

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: BaselineMutation.PopulationUpdated,
            payload: mockPop
        });

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("validate");

        expect(dispatch.mock.calls[1][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[1][2]).toStrictEqual({root: true});
    });

    testUploadErrorCommitted("/baseline/shape/", "ShapeUploadError", "ShapeUpdated", actions.uploadShape);

    it("gets baseline data, commits it and marks state as ready", async () => {

        const mockShape = mockShapeResponse();
        const mockPopulation = mockPopulationResponse();
        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}, filename: "test.pjnz"}));

        mockAxios.onGet(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        mockAxios.onGet(`/baseline/population/`)
            .reply(200, mockSuccess(mockPopulation));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.getBaselineData({commit, dispatch} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(BaselineMutation.PJNZUpdated);
        expect(calls).toContain(BaselineMutation.ShapeUpdated);
        expect(calls).toContain(BaselineMutation.PopulationUpdated);
        expect(calls).toContain(BaselineMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(4);
        //ready payload is true, which is frozen by definition
    });

    it("commits response on validate", async () => {
        const mockValidateResponse = mockValidateBaselineResponse();
        mockAxios.onGet(`/baseline/validate/`)
            .reply(200, mockSuccess(mockValidateResponse));

        const commit = jest.fn();
        await actions.validate({commit} as any);

        //commits to Validating first
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.Validating,
            payload: null
        });

        //then commits response from api
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: BaselineMutation.Validated,
            payload: mockValidateResponse
        });
    });

    it("commits response on validate error", async () => {
        mockAxios.onGet(`/baseline/validate/`)
            .reply(400, mockFailure("Baseline is inconsistent"));

        const commit = jest.fn();
        await actions.validate({commit} as any);

        //commits to Validating first
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.Validating,
            payload: null
        });

        //then commits response from api
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: BaselineMutation.BaselineError,
            payload: mockError("Baseline is inconsistent")
        });
    });

    it("fails silently and marks state ready if getting baseline data fails", async () => {

        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(500);

        mockAxios.onGet(`/baseline/shape/`)
            .reply(500);

        mockAxios.onGet(`/baseline/population/`)
            .reply(500);

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.getBaselineData({commit, dispatch} as any);

        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.Ready);
    });

    it("deletes pjnz and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/pjnz/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deletePJNZ({commit, dispatch} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.PJNZUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes shape and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/shape/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deleteShape({commit, dispatch} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.ShapeUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes population and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/population/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deletePopulation({commit, dispatch} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.PopulationUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes all", async () => {
        mockAxios.onDelete("/baseline/pjnz/")
            .reply(200, mockSuccess(true));
        mockAxios.onDelete("/baseline/shape/")
            .reply(200, mockSuccess(true));
        mockAxios.onDelete("/baseline/population/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deleteAll({commit, dispatch} as any);
        expect(mockAxios.history["delete"].length).toBe(3)
    });

});
