import {actions} from "../../app/store/projects/actions";
import {login, rootState} from "./integrationTest";
import {ProjectsMutations} from "../../app/store/projects/mutations";
import {RootMutation} from "../../app/store/root/mutations";
import {initialProjectsState} from "../../app/store/projects/projects";
import {emptyState} from "../../app/root";

describe("Projects actions", () => {
    beforeAll(async () => {
        await login();
    });

    it("can create project", async () => {
        const commit = jest.fn();
        await actions.createProject({commit, rootState, state:initialProjectsState()} as any, "v1");

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(ProjectsMutations.SetLoading);
        expect(commit.mock.calls[0][0]["payload"]).toBe(true);

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.SetProject);
        const createdProject = commit.mock.calls[1][0]["payload"];
        expect(createdProject.id).toBeTruthy();
        expect(createdProject.name).toBe("v1");
        expect(createdProject.snapshots.length).toBe(1);
    });

    it("can save snapshot", async (done) => {
        const commit = jest.fn();
        const state = initialProjectsState();
        await actions.createProject({commit, rootState, state} as any, "v1");

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentSnapshot = createdProject.snapshots[0];

        await actions.uploadSnapshotState({commit, rootState: emptyState(), state} as any);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(5);
            expect(commit.mock.calls[2][0]["type"]).toBe(ProjectsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[2][0]["payload"]).toBe(true);
            expect(commit.mock.calls[3][0]["type"]).toBe(ProjectsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[3][0]["payload"]).toBe(false);
            expect(commit.mock.calls[4][0]["type"]).toBe(ProjectsMutations.SnapshotUploadSuccess);

            done();
        }, 2500);
    });

    it("can create new snapshot", async (done) => {
        const commit = jest.fn();
        const state = initialProjectsState();
        await actions.createProject({commit, rootState: emptyState(), state} as any, "v1");

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentSnapshot = createdProject.snapshots[0];

        await actions.newSnapshot({commit, rootState: emptyState(), state} as any);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(5);
            expect(commit.mock.calls[2][0]["type"]).toBe(ProjectsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[2][0]["payload"]).toBe(false);
            expect(commit.mock.calls[3][0]["type"]).toBe(ProjectsMutations.SnapshotUploadSuccess);
            expect(commit.mock.calls[4][0]["type"]).toBe(ProjectsMutations.SnapshotCreated);

            const newSnapshot = commit.mock.calls[4][0]["payload"];
            expect(newSnapshot.id).toBeTruthy();
            expect(newSnapshot.id).not.toEqual(createdProject.snapshots[0].id);

            done();
        }, 500);
    });

    it("can load snapshot", async(done) => {
        const state = initialProjectsState();
        const commit = jest.fn();
        await actions.createProject({commit, rootState, state} as any, "v1");

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentSnapshot = createdProject.snapshots[0];

        await actions.uploadSnapshotState({commit, rootState: emptyState(), state} as any);

        const dispatch = jest.fn();
        const versionId = createdProject.id;
        const snapshotId = createdProject.snapshots[0].id;
        setTimeout(() => {
            actions.loadSnapshot({commit, dispatch, state, rootState} as any, {versionId, snapshotId});
            setTimeout(() => {
                expect(dispatch.mock.calls[0][0]).toBe("load/loadFromSnapshot");
                const fetchedSnapshot = dispatch.mock.calls[0][1];
                expect(fetchedSnapshot.state).toBeTruthy();
                expect(fetchedSnapshot.files).toBeTruthy();
                done();
            }, 400);
        }, 2400);
    });
});
