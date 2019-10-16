import {mockAxios, mockFailure, mockModelRunState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/modelRun/actions";
import {ModelStatusResponse} from "../../app/generated";

describe("Model run actions", () => {

    afterEach(() => {
        mockAxios.reset();
    });

    it("commits run id after triggering a model run ", async () => {

        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const commit = jest.fn();
        await actions.run({commit} as any, {
            max_iterations: 1,
            no_of_simulations: 1,
            options: {
                programme: false,
                anc: false
            }
        });

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ModelRunStarted",
            payload: {id: "12345"}
        });

    });

    it("fetches model run result after polling when status is done", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({status: {done: true} as ModelStatusResponse});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch} as any, "1234");
        setInterval(() => {
            expect(dispatch.mock.calls[0][0]).toStrictEqual("getResult");
            expect(dispatch.mock.calls[0][1]).toStrictEqual("1234");
            done();
        }, 2100);
    });

    it("does not fetch model run result after polling if done is not true", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({status: {done: false} as ModelStatusResponse});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch} as any, "1234");
        setInterval(() => {
            expect(dispatch.mock.calls.length).toEqual(0);
            done();
        }, 2100);

    });

    it("poll commits status when successfully fetched", async (done) => {
        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess("TEST DATA"));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockModelRunState();

        actions.poll({commit, state} as any, "1234");

        setTimeout(() => {
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "RunStatusUpdated",
                payload: "TEST DATA"
            });

            done();
        }, 2100);
    });

    it("poll commits error when unsuccessful fetch", (done) => {
        mockAxios.onGet(`/model/status/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState();

        actions.poll({commit, state} as any, "1234");

        setTimeout(() => {
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "RunStatusError",
                payload: "Test Error"
            });

            done();
        }, 2100);
    });

    it("getResult commits result when successfully fetched", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: true} as ModelStatusResponse});

        await actions.getResult({commit, state} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunResultFetched",
            payload: "TEST DATA"
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });

    it("getResult commits error when unsuccessful fetch", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: true, id: "1234"} as ModelStatusResponse});

        await actions.getResult({commit, state} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunResultError",
            payload: "Test Error"
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });

    it("getResult does not get result if done is not true", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: false, id: "1234"} as ModelStatusResponse});

        await actions.getResult({commit, state} as any);

        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });
});
