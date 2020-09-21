import {
    mockAxios,
    mockBaselineState,
    mockDataset,
    mockDatasetResource,
    mockError,
    mockFailure,
    mockPopulationResponse,
    mockRootState,
    mockShapeResponse,
    mockSuccess,
    mockValidateBaselineResponse
} from "../mocks";
import {actions} from "../../app/store/baseline/actions";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {expectEqualsFrozen, testUploadErrorCommitted} from "../testHelpers";
import {ADRSchemas} from "../../app/types";
import Mock = jest.Mock;

const FormData = require("form-data");
const adrSchemas: ADRSchemas = {
    baseUrl: "adr.com",
    pjnz: "pjnz",
    population: "pop",
    shape: "shape",
    survey: "survey",
    programme: "program",
    anc: "anc"
}
const rootState = mockRootState({
    adrSchemas
});

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

        await actions.uploadPJNZ({commit, state, dispatch, rootState} as any, new FormData());

        checkPJNZImportUpload(commit, dispatch)
    });

    it("sets country and iso3 after PJNZ import, and fetches plotting metadata, and validates", async () => {

        mockAxios.onPost(`/adr/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi", iso3: "MWI"}}));

        const commit = jest.fn();
        const state = mockBaselineState({iso3: "MWI"});
        const dispatch = jest.fn();

        await actions.importPJNZ({commit, state, dispatch, rootState} as any, "some-url");

        checkPJNZImportUpload(commit, dispatch)
    });

    const checkPJNZImportUpload = (commit: Mock, dispatch: Mock) => {
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
    }

    it("upload PJNZ does not fetch plotting metadata or validate if error occurs", async () => {
        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState({pjnzError: mockError("test error")});
        const dispatch = jest.fn();
        await actions.uploadPJNZ({commit, state, dispatch, rootState} as any, new FormData());

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
    });

    it("import PJNZ does not fetch plotting metadata or validate if error occurs", async () => {
        mockAxios.onPost(`/adr/pjnz/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState({pjnzError: mockError("test error")});
        const dispatch = jest.fn();
        await actions.importPJNZ({commit, state, dispatch, rootState} as any, "some-url");

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
        await actions.uploadShape({commit, dispatch, rootState} as any, new FormData());

        checkShapeImportUpload(commit, dispatch, mockShape);
    });

    it("commits response and validates after shape file import", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onPost(`/adr/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.importShape({commit, dispatch, rootState} as any, "some-url");

        checkShapeImportUpload(commit, dispatch, mockShape);
    });

    const checkShapeImportUpload = (commit: Mock, dispatch: Mock, mockShape: any) => {
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
    }

    it("commits response and validates after population file upload", async () => {

        const mockPop = mockPopulationResponse();
        mockAxios.onPost(`/baseline/population/`)
            .reply(200, mockSuccess(mockPop));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.uploadPopulation({commit, dispatch, rootState} as any, new FormData());

        checkPopulationImportUpload(commit, dispatch, mockPop);
    });

    it("commits response and validates after population file import", async () => {

        const mockPop = mockPopulationResponse();
        mockAxios.onPost(`/adr/population/`)
            .reply(200, mockSuccess(mockPop));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.importPopulation({commit, dispatch, rootState} as any, "some-url");

        checkPopulationImportUpload(commit, dispatch, mockPop);
    });

    const checkPopulationImportUpload = (commit: Mock, dispatch: Mock, mockPop: any) => {
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
    }

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
        await actions.getBaselineData({commit, dispatch, rootState} as any);

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
        await actions.validate({commit, rootState} as any);

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
        await actions.validate({commit, rootState} as any);

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
        await actions.getBaselineData({commit, dispatch, rootState} as any);

        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.Ready);
    });

    it("deletes pjnz and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/pjnz/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deletePJNZ({commit, dispatch, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.PJNZUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes shape and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/shape/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deleteShape({commit, dispatch, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.ShapeUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes population and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/population/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deletePopulation({commit, dispatch, rootState} as any);
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
        await actions.deleteAll({commit, dispatch, rootState} as any);
        expect(mockAxios.history["delete"].length).toBe(3)
    });

    it("refreshes dataset metdata", async () => {

        mockAxios.onGet("/adr/datasets/1234")
            .reply(200, mockSuccess({
                resources: [
                    {url: "something.com", revision_id: "po1234", resource_type: "pop"},
                    {url: "something.com", revision_id: "pj1234", resource_type: "pjnz"},
                    {url: "something.com", revision_id: "sh1234", resource_type: "shape"},
                    {url: "something.com", revision_id: "su1234", resource_type: "survey"},
                    {url: "something.com", revision_id: "pr1234", resource_type: "program"},
                    {url: "something.com", revision_id: "an1234", resource_type: "anc"},
                    {url: "something.com", revision_id: "ra1234", resource_type: "random"},

                ]
            }))

        const commit = jest.fn();
        const state = mockBaselineState({
            selectedDataset: mockDataset({id: "1234"})
        });

        await actions.refreshDatasetMetadata({commit, rootState, state} as any);

        expect(commit.mock.calls[0][0]).toBe(BaselineMutation.UpdateDatasetResources);
        expect(commit.mock.calls[0][1]).toEqual({
            pjnz: mockDatasetResource({url: "something.com", revisionId: "pj1234"}),
            shape: mockDatasetResource({url: "something.com", revisionId: "sh1234"}),
            pop: mockDatasetResource({url: "something.com", revisionId: "po1234"}),
            survey: mockDatasetResource({url: "something.com", revisionId: "su1234"}),
            program: mockDatasetResource({url: "something.com", revisionId: "pr1234"}),
            anc: mockDatasetResource({url: "something.com", revisionId: "an1234"})
        });
    });

    it("refreshDatasetMetadata can handle missing resources", async () => {

        mockAxios.onGet("/adr/datasets/1234")
            .reply(200, mockSuccess({
                resources: [
                    {url: "something.com", revision_id: "ra1234", resource_type: "random"},

                ]
            }))

        const commit = jest.fn();
        const state = mockBaselineState({
            selectedDataset: mockDataset({id: "1234"})
        });

        await actions.refreshDatasetMetadata({commit, rootState, state} as any);

        expect(commit.mock.calls[0][0]).toBe(BaselineMutation.UpdateDatasetResources);
        expect(commit.mock.calls[0][1]).toEqual({
            pjnz: null,
            shape: null,
            pop: null,
            survey: null,
            program: null,
            anc: null
        });
    });

    it("refreshDatasetMetadata does nothing if no dataset", async () => {
        const commit = jest.fn();
        const state = mockBaselineState();
        await actions.refreshDatasetMetadata({commit, rootState, state} as any);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("refreshDatasetMetadata does nothing if api call fails", async () => {
        mockAxios.onGet("/adr/datasets/1234")
            .reply(500);

        const commit = jest.fn();
        const state = mockBaselineState({
            selectedDataset: mockDataset({id: "1234"})
        });
        await actions.refreshDatasetMetadata({commit, rootState, state} as any);
        expect(commit.mock.calls.length).toBe(0);
    });

});
