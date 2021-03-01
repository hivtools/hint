import {mockADRState, mockAxios, mockError, mockRootState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/adr/actions";
import {ADRMutation} from "../../app/store/adr/mutations";

describe("ADR actions", () => {
    const state = mockADRState();
    const rootState = mockRootState();

    it("fetches key", async () => {
        mockAxios.onGet(`/adr/key/`)
            .reply(200, mockSuccess("1234"));

        const commit = jest.fn();

        await actions.fetchKey({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.UpdateKey,
                payload: "1234"
            });
    });

    it("saves key", async () => {
        mockAxios.onPost(`/adr/key/`)
            .reply(200, mockSuccess("1234"));

        const commit = jest.fn();

        await actions.saveKey({commit, state, rootState} as any, "1234");

        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.SetKeyError,
                payload: null
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.UpdateKey,
                payload: "1234"
            });
    });

    it("deletes key", async () => {
        mockAxios.onDelete(`/adr/key/`)
            .reply(200, mockSuccess(null));

        const commit = jest.fn();

        await actions.deleteKey({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type:ADRMutation.SetKeyError,
                payload: null
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.UpdateKey,
                payload: null
            });
    });

    it("fetches datasets", async () => {
        mockAxios.onGet(`/adr/datasets/`)
            .reply(200, mockSuccess([1]));

        const commit = jest.fn();

        await actions.getDatasets({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: true
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.SetDatasets,
                payload: [1]
            });
        expect(commit.mock.calls[2][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: false
            });
    });

    it("resets datasets fetching if error response", async () => {
        mockAxios.onGet(`/adr/datasets/`)
            .reply(500, mockError("error"));

        const commit = jest.fn();

        await actions.getDatasets({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: true
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: false
            });
    });

    it("fetches schemas", async () => {
        mockAxios.onGet(`/adr/schemas/`)
            .reply(200, mockSuccess({baseUrl: "adr.com"}));

        const commit = jest.fn();

        await actions.getSchemas({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0])
            .toEqual({
                type: ADRMutation.SetSchemas,
                payload: {baseUrl: "adr.com"}
            });
    });

});
