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

    it("can check user exists", async () => {
        let result = await actions.userExists({rootState} as any, "test.user@example.com");
        expect(result).toBe(true);

        result = await actions.userExists({rootState} as any, "bad.user@example.com");
        expect(result).toBe(false);
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
        expect(createdProject.versions.length).toBe(1);
    });

    it("can save version", async (done) => {
        const commit = jest.fn();
        const state = initialProjectsState();
        await actions.createProject({commit, rootState, state} as any, "v1");

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentVersion = createdProject.versions[0];

        await actions.uploadVersionState({commit, rootState: emptyState(), state} as any);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(5);
            expect(commit.mock.calls[2][0]["type"]).toBe(ProjectsMutations.SetVersionUploadPending);
            expect(commit.mock.calls[2][0]["payload"]).toBe(true);
            expect(commit.mock.calls[3][0]["type"]).toBe(ProjectsMutations.SetVersionUploadPending);
            expect(commit.mock.calls[3][0]["payload"]).toBe(false);
            expect(commit.mock.calls[4][0]["type"]).toBe(ProjectsMutations.VersionUploadSuccess);

            done();
        }, 2500);
    });

    it("can create new version", async (done) => {
        const commit = jest.fn();
        const state = initialProjectsState();
        await actions.createProject({commit, rootState: emptyState(), state} as any, "v1");

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentVersion = createdProject.versions[0];

        await actions.newVersion({commit, rootState: emptyState(), state} as any);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(5);
            expect(commit.mock.calls[2][0]["type"]).toBe(ProjectsMutations.SetVersionUploadPending);
            expect(commit.mock.calls[2][0]["payload"]).toBe(false);
            expect(commit.mock.calls[3][0]["type"]).toBe(ProjectsMutations.VersionUploadSuccess);
            expect(commit.mock.calls[4][0]["type"]).toBe(ProjectsMutations.VersionCreated);

            const newVersion = commit.mock.calls[4][0]["payload"];
            expect(newVersion.id).toBeTruthy();
            expect(newVersion.id).not.toEqual(createdProject.versions[0].id);

            done();
        }, 500);
    });

    it("can load version", async(done) => {
        const state = initialProjectsState();
        const commit = jest.fn();
        await actions.createProject({commit, rootState, state} as any, "v1");

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentVersion = createdProject.versions[0];

        await actions.uploadVersionState({commit, rootState: emptyState(), state} as any);

        const dispatch = jest.fn();
        const projectId = createdProject.id;
        const versionId = createdProject.versions[0].id;
        setTimeout(() => {
            actions.loadVersion({commit, dispatch, state, rootState} as any, {projectId: projectId, versionId});
            setTimeout(() => {
                expect(dispatch.mock.calls[0][0]).toBe("load/loadFromVersion");
                const fetchedVersion = dispatch.mock.calls[0][1];
                expect(fetchedVersion.state).toBeTruthy();
                expect(fetchedVersion.files).toBeTruthy();
                done();
            }, 400);
        }, 2400);
    });

    it("can delete project", async(done) => {
        const state = initialProjectsState();
        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.createProject({commit, rootState, state} as any, "v1");
        expect(commit.mock.calls.length).toBe(2);

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentVersion = createdProject.versions[0];

        await actions.deleteProject({commit, dispatch, state, rootState} as any, state.currentProject!.id);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[2][0]).toStrictEqual({type: ProjectsMutations.ClearCurrentVersion});
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            done();
        });
    });

    it("can delete version", async(done) => {
        const state = initialProjectsState();
        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.createProject({commit, rootState, state} as any, "v1");
        expect(commit.mock.calls.length).toBe(2);

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentVersion = createdProject.versions[0];

        const ids = {projectId: state.currentProject!.id, versionId: state.currentVersion!.id};
        await actions.deleteVersion({commit, dispatch, state, rootState} as any, ids);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[2][0]).toStrictEqual({type: ProjectsMutations.ClearCurrentVersion});
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            done();
        });
    });

    it("can promote version", async(done) => {
        const state = initialProjectsState();
        const commit = jest.fn();
        const dispatch = jest.fn();
        
        await actions.createProject({commit, rootState, state} as any, "v1");
        expect(commit.mock.calls.length).toBe(2);

        const createdProject = commit.mock.calls[1][0]["payload"];
        state.currentProject = createdProject;
        state.currentVersion = createdProject.versions[0];
        const versionPayload = {version: {projectId: state.currentProject!.id, versionId: state.currentVersion!.id}, name: 'newProject'};
        
        await actions.promoteVersion({commit, dispatch, state, rootState} as any, versionPayload);
        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            done();
        });
    });
});
