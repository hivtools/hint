import {actions} from "../../app/store/versions/actions";
import {login, rootState} from "./integrationTest";
import {VersionsMutations} from "../../app/store/versions/mutations";
import {RootMutation} from "../../app/store/root/mutations";
import {initialVersionsState} from "../../app/store/versions/versions";
import {emptyState} from "../../app/root";

describe("Versions actions", () => {
    beforeAll(async () => {
        await login();
    });

    it("can create version", async () => {
        const commit = jest.fn();
        await actions.createVersion({commit, rootState, state:initialVersionsState()} as any, "v1");

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(VersionsMutations.SetLoading);
        expect(commit.mock.calls[0][0]["payload"]).toBe(true);

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.SetVersion);
        const createdVersion = commit.mock.calls[1][0]["payload"];
        expect(createdVersion.id).toBeTruthy();
        expect(createdVersion.name).toBe("v1");
        expect(createdVersion.snapshots.length).toBe(1);
    });

    it("can save snapshot", async (done) => {
        const commit = jest.fn();
        const state = initialVersionsState();
        await actions.createVersion({commit, rootState, state} as any, "v1");

        const createdVersion = commit.mock.calls[1][0]["payload"];
        state.currentVersion = createdVersion;
        state.currentSnapshot = createdVersion.snapshots[0];

        await actions.uploadSnapshotState({commit, rootState: emptyState(), state} as any);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(5);
            expect(commit.mock.calls[2][0]["type"]).toBe(VersionsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[2][0]["payload"]).toBe(true);
            expect(commit.mock.calls[3][0]["type"]).toBe(VersionsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[3][0]["payload"]).toBe(false);
            expect(commit.mock.calls[4][0]["type"]).toBe(VersionsMutations.SnapshotUploadSuccess);

            done();
        }, 2500);
    });
});
