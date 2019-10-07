import {mockAxios, mockFailure, mockModelRunState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/modelRun/actions";

describe("Model run actions", () => {

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

    it("fetches model run result when poll gets success status", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({success: true});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch} as any,1234);
        setInterval(() => {
            expect(dispatch.mock.calls[0][0]).toStrictEqual("getResult");
            expect(dispatch.mock.calls[0][1]).toStrictEqual(1234);
            done();
        }, 2100);


    });

    it("does not fetch model run result when poll gets no success status", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({success: false});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch} as any,1234);
        setInterval(() => {
            expect(dispatch.mock.calls.length).toEqual(0);
            done();
        }, 2100);


    });

    it("getResult commits result when successfully fetched", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const state = mockModelRunState({success: true, modelRunId: "1234"});

        await actions.getResult({commit, state} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunResultFetched",
            payload: "TEST DATA"
        });
    });

    it("getResult commits error when unsuccessful fetch", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState({success: true, modelRunId: "1234"});

        await actions.getResult({commit, state} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunResultError",
            payload: "Test Error"
        });
    });

});
