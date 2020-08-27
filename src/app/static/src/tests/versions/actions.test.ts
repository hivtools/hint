import {mockAxios, mockFailure, mockRootState, mockSuccess, mockVersionsState} from "../mocks";
import {actions} from "../../app/store/versions/actions";
import {VersionsMutations} from "../../app/store/versions/mutations";
import {RootMutation} from "../../app/store/root/mutations";
import {ErrorsMutation} from "../../app/store/errors/mutations";
import {Version} from "../../app/types";
import {serialiseState} from "../../app/localStorageManager";

describe("Versions actions", () => {
    beforeEach(() => {
        mockAxios.reset();  
        // stop apiService logging to console
        console.log = jest.fn();
        console.info = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.info as jest.Mock).mockClear();
    });

    const rootState = mockRootState();

    const mockVersion: Version = {id: 1, name: "testVersion", snapshots: [{id: "snap-id", created: "", updated: ""}]};

    it("createVersion posts to new version endpoint and sets error on unsuccessful response", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockVersionsState({error: "TEST ERROR" as any});

        actions.createVersion({commit, state, rootState} as any, "newVersion");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: VersionsMutations.SetLoading, payload: true});

            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: VersionsMutations.VersionError,
                payload: expectedError
            });
            done();
        });
    });

    it("createVersion posts to new version endpoint and resets version with root on successful response", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(200, mockSuccess("TestVersion"));

        const commit = jest.fn();
        const state = mockVersionsState();

        actions.createVersion({commit, state, rootState} as any, "newVersion");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: VersionsMutations.SetLoading, payload: true});

            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("name=newVersion");
            expect(commit.mock.calls[1][0]).toStrictEqual({type: RootMutation.SetVersion, payload: "TestVersion"});
            expect(commit.mock.calls[1][1]).toStrictEqual({root: true});
            done();
        });
    });

    it("gets versions and commits mutation on successful response", async(done) => {
        const testVersions = [{id: 1, name: "v1", snapshots: []}];
        mockAxios.onGet("/projects/")
            .reply(200, mockSuccess(testVersions));

        const commit = jest.fn();
        const state = mockVersionsState();

        actions.getVersions({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: VersionsMutations.SetLoading, payload: true});
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: VersionsMutations.SetPreviousVersions,
                payload: testVersions
            });
            done();
        });
    });

    it("if current snapshot, createVersion uploads current snapshot before post to new version endpoint", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(200, mockSuccess("TestVersion"));
        mockAxios.onPost( "/project/1/snapshot/snap-id/state/")
            .reply(200, mockSuccess("ok"));

        const commit = jest.fn();
        const state = mockVersionsState({
            currentVersion: mockVersion,
            currentSnapshot: mockVersion.snapshots[0],
            snapshotUploadPending: true
        });

        actions.createVersion({commit, state, rootState} as any, "newVersion");

        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);
            expect(mockAxios.history.post[0].url).toBe("/project/1/snapshot/snap-id/state/");
            expect(mockAxios.history.post[1].url).toBe("/project/");
            done();
        });
    });

    it("gets versions and sets error on unsuccessful response", async(done) => {
        mockAxios.onGet("/projects/")
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockVersionsState();

        actions.getVersions({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: VersionsMutations.SetLoading, payload: true});
            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: VersionsMutations.VersionError,
                payload: expectedError
            });
            done();
        });
    });

    it("uploadSnapshotState does nothing if no current snapshot", async (done) => {
        const commit = jest.fn();
        const state = mockVersionsState();

        actions.uploadSnapshotState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(0);
            expect(mockAxios.history.post.length).toBe(0);
            done();
        }, 2500);
    });

    it("uploadSnapshotState does nothing if no snapshot upload is pending", async (done) => {
        const commit = jest.fn();
        const state = mockVersionsState({
            currentVersion: mockVersion,
            currentSnapshot: mockVersion.snapshots[0],
            snapshotUploadPending: true
        });

        actions.uploadSnapshotState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(0);
            expect(mockAxios.history.post.length).toBe(0);
            done();
        }, 2500);
    });

    it("uploadSnapshotState sets pending then unsets and uploads state, and commits SnapshotUploadSuccess", async (done) => {
        const commit = jest.fn();
        const state = mockVersionsState({
            currentVersion: mockVersion,
            currentSnapshot: mockVersion.snapshots[0],
            snapshotUploadPending: false
        });

        const url = "/project/1/snapshot/snap-id/state/";
        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        actions.uploadSnapshotState({commit, state, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual(
            {type: VersionsMutations.SetSnapshotUploadPending, payload: true});

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[1][0]).toStrictEqual(
                {type: VersionsMutations.SetSnapshotUploadPending, payload: false});
            expect(commit.mock.calls[2][0].type).toStrictEqual(VersionsMutations.SnapshotUploadSuccess);

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].url).toBe(url);
            const posted = mockAxios.history.post[0].data;
            expect(JSON.parse(posted)).toStrictEqual(serialiseState(rootState));
            done();
        }, 2500);
    });

    it("uploadSnapshotState commits ErrorAdded on error response", async (done) => {
        const commit = jest.fn();
        const state = mockVersionsState({
            currentVersion: mockVersion,
            currentSnapshot: mockVersion.snapshots[0],
            snapshotUploadPending: false
        });

        const url = "/project/1/snapshot/snap-id/state/";
        mockAxios.onPost(url)
            .reply(500, mockFailure("TEST ERROR"));

        actions.uploadSnapshotState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[2][0].type).toStrictEqual(`errors/${ErrorsMutation.ErrorAdded}`);
            expect(commit.mock.calls[2][0].payload.detail).toStrictEqual("TEST ERROR");

            done();
        }, 2500);
    });

    it("newSnapshot uploads current snapshot state then requests new snapshot, commits SnapshotCreated", async (done) => {
        const commit = jest.fn();
        const state = mockVersionsState({
            currentVersion: mockVersion,
            currentSnapshot: mockVersion.snapshots[0]
        });

        const stateUrl = "/project/1/snapshot/snap-id/state/";
        mockAxios.onPost(stateUrl)
            .reply(200, mockSuccess("OK"));

        const newSnapshot = {id: "new-snap-id", created: "new time", updated: "new time"};
        const url = "project/1/snapshot/?parent=snap-id";
        mockAxios.onPost(url)
            .reply(200, mockSuccess(newSnapshot));

        actions.newSnapshot({commit, state, rootState} as any);
        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);

            expect(mockAxios.history.post[0].url).toBe(stateUrl);
            const postedState = mockAxios.history.post[0].data;
            expect(JSON.parse(postedState)).toStrictEqual(serialiseState(rootState));

            expect(mockAxios.history.post[1].url).toBe(url);

            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[0][0].type).toBe(VersionsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[0][0].payload).toBe(false);
            expect(commit.mock.calls[1][0].type).toBe(VersionsMutations.SnapshotUploadSuccess);
            expect(commit.mock.calls[2][0].type).toBe(VersionsMutations.SnapshotCreated);
            expect(commit.mock.calls[2][0].payload).toStrictEqual(newSnapshot);

            done();
        });
    });

    it("newSnapshot adds error on error response", async (done) => {
        const commit = jest.fn();
        const state = mockVersionsState({
            currentVersion: mockVersion,
            currentSnapshot: mockVersion.snapshots[0]
        });

        const stateUrl = "/project/1/snapshot/snap-id/state/";
        mockAxios.onPost(stateUrl)
            .reply(200, mockSuccess("OK"));

        const url = "project/1/snapshot/?parent=snap-id";
        mockAxios.onPost(url)
            .reply(500, mockFailure("TEST ERROR"));

        actions.newSnapshot({commit, state, rootState} as any);
        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);

            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[2][0].type).toBe("errors/ErrorAdded");
            expect(commit.mock.calls[2][0].payload.detail).toStrictEqual("TEST ERROR");
            expect(commit.mock.calls[2][1]).toStrictEqual({root: true});

            done();
        });
    });
});
