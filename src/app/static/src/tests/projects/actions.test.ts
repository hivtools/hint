import {mockAxios, mockFailure, mockRootState, mockSuccess, mockProjectsState} from "../mocks";
import {actions} from "../../app/store/projects/actions";
import {ProjectsMutations} from "../../app/store/projects/mutations";
import {RootMutation} from "../../app/store/root/mutations";
import {ErrorsMutation} from "../../app/store/errors/mutations";
import {Project} from "../../app/types";
import {serialiseState} from "../../app/localStorageManager";

describe("Projects actions", () => {
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

    const mockProject: Project = {id: 1, name: "testProject", snapshots: [{id: "snap-id", created: "", updated: ""}]};

    it("createProject posts to new project endpoint and sets error on unsuccessful response", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockProjectsState({error: "TEST ERROR" as any});

        actions.createProject({commit, state, rootState} as any, "newProject");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});

            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("createProject posts to new project endpoint and resets project with root on successful response", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(200, mockSuccess("TestProject"));

        const commit = jest.fn();
        const state = mockProjectsState();

        actions.createProject({commit, state, rootState} as any, "newProject");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});

            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("name=newProject");
            expect(commit.mock.calls[1][0]).toStrictEqual({type: RootMutation.SetProject, payload: "TestProject"});
            expect(commit.mock.calls[1][1]).toStrictEqual({root: true});
            done();
        });
    });

    it("gets projects and commits mutation on successful response", async(done) => {
        const testProjects = [{id: 1, name: "v1", snapshots: []}];
        mockAxios.onGet("/projects/")
            .reply(200, mockSuccess(testProjects));

        const commit = jest.fn();
        const state = mockProjectsState();

        actions.getProjects({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.SetPreviousProjects,
                payload: testProjects
            });
            done();
        });
    });

    it("if current snapshot, createProject uploads current snapshot before post to new project endpoint", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(200, mockSuccess("TestProject"));
        mockAxios.onPost( "/project/1/snapshot/snap-id/state/")
            .reply(200, mockSuccess("ok"));

        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentSnapshot: mockProject.snapshots[0],
            snapshotUploadPending: true
        });

        actions.createProject({commit, state, rootState} as any, "newProject");

        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);
            expect(mockAxios.history.post[0].url).toBe("/project/1/snapshot/snap-id/state/");
            expect(mockAxios.history.post[1].url).toBe("/project/");
            done();
        });
    });

    it("gets projects and sets error on unsuccessful response", async(done) => {
        mockAxios.onGet("/projects/")
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockProjectsState();

        actions.getProjects({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("uploadSnapshotState does nothing if no current snapshot", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState();

        actions.uploadSnapshotState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(0);
            expect(mockAxios.history.post.length).toBe(0);
            done();
        }, 2500);
    });

    it("uploadSnapshotState does nothing if no snapshot upload is pending", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentSnapshot: mockProject.snapshots[0],
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
        const state = mockProjectsState({
            currentProject: mockProject,
            currentSnapshot: mockProject.snapshots[0],
            snapshotUploadPending: false
        });

        const url = "/project/1/snapshot/snap-id/state/";
        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        actions.uploadSnapshotState({commit, state, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual(
            {type: ProjectsMutations.SetSnapshotUploadPending, payload: true});

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[1][0]).toStrictEqual(
                {type: ProjectsMutations.SetSnapshotUploadPending, payload: false});
            expect(commit.mock.calls[2][0].type).toStrictEqual(ProjectsMutations.SnapshotUploadSuccess);

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].url).toBe(url);
            const posted = mockAxios.history.post[0].data;
            expect(JSON.parse(posted)).toStrictEqual(serialiseState(rootState));
            done();
        }, 2500);
    });

    it("uploadSnapshotState commits ErrorAdded on error response", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentSnapshot: mockProject.snapshots[0],
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
        const state = mockProjectsState({
            currentProject: mockProject,
            currentSnapshot: mockProject.snapshots[0]
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
            expect(commit.mock.calls[0][0].type).toBe(ProjectsMutations.SetSnapshotUploadPending);
            expect(commit.mock.calls[0][0].payload).toBe(false);
            expect(commit.mock.calls[1][0].type).toBe(ProjectsMutations.SnapshotUploadSuccess);
            expect(commit.mock.calls[2][0].type).toBe(ProjectsMutations.SnapshotCreated);
            expect(commit.mock.calls[2][0].payload).toStrictEqual(newSnapshot);

            done();
        });
    });

    it("newSnapshot adds error on error response", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentSnapshot: mockProject.snapshots[0]
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
