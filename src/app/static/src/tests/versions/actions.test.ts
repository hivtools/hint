import {mockAxios, mockFailure, mockRootState, mockSuccess, mockVersionsState} from "../mocks";
import {actions} from "../../app/store/versions/actions";
import {VersionsMutations} from "../../app/store/versions/mutations";
import {RootMutation} from "../../app/store/root/mutations";

describe("Versions actions", () => {
    beforeEach(() => {
        mockAxios.reset();
    });

    const rootState = mockRootState();

    it("posts to new version endpoint and sets error on unsuccessful response", async (done) => {
        mockAxios.onPost(`/version/`)
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockVersionsState({error: "TEST ERROR" as any});

        actions.createVersion({commit, state, rootState} as any, "newVersion");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: VersionsMutations.SetLoading, payload: true});

            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({type: VersionsMutations.VersionError, payload: expectedError});
            done();
        });
    });

    it("posts to new version endpoint and resets version with root on successful response", async (done) => {
        mockAxios.onPost(`/version/`)
            .reply(200, mockSuccess("TestVersion"));

        const commit = jest.fn();
        const state = mockVersionsState();

        actions.createVersion({commit, state, rootState} as any, "newVersion");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: VersionsMutations.SetLoading, payload: true});

            const posted = mockAxios.history.post[0].data;
            expect(JSON.parse(posted)).toStrictEqual({name: "newVersion"});

            expect(commit.mock.calls[1][0]).toStrictEqual({type: RootMutation.ResetVersion, payload: "TestVersion"});
            expect(commit.mock.calls[1][1]).toStrictEqual({root: true});
            done();
        });
    });
});
