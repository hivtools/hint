import {mockProjectsState} from "../mocks";
import {mutations, ProjectsMutations} from "../../app/store/projects/mutations";

describe("Projects mutations", () => {
    const testNow = Date.now();
    global.Date.now = jest.fn(() => testNow);

    const mockProject = {
        id: 1,
        name: "v1",
        versions: [{id: "OLD VERSION", created: "old created time", updated: "old updated time"}]
    };

    const consoleSpy = jest.fn();

    beforeEach(() => {
        console.error = consoleSpy;
    });

    afterEach(() => {
        (console.error as jest.Mock).mockClear();
    });

    it("sets loading", () => {
        const state = mockProjectsState({error: "test error"} as any);

        mutations[ProjectsMutations.SetLoading](state, {payload: true});
        expect(state.loading).toBe(true);
        expect(state.error).toBe(null);

        mutations[ProjectsMutations.SetLoading](state, {payload: false});
        expect(state.loading).toBe(false);
    });

    it("sets error", () => {
        const state = mockProjectsState({loading: true});

        const error = {error: "error", detail: "detail"};
        mutations[ProjectsMutations.ProjectError](state, {payload: error});

        expect(state.error).toBe(error);
        expect(state.loading).toBe(false);
    });

    it("sets previous projects", () => {
        const state = mockProjectsState({loading: true});
        mutations[ProjectsMutations.SetPreviousProjects](state, {payload: ["TEST VERSION"]});

        expect(state.previousProjects).toStrictEqual(["TEST VERSION"]);
        expect(state.loading).toBe(false);
    });

    it("sets version upload pending", () => {
        const state = mockProjectsState();
        mutations[ProjectsMutations.SetVersionUploadPending](state, {payload: true});
        expect(state.versionUploadPending).toBe(true);
    });

    it("VersionUploadSuccess sets versionTime", () => {
        const state = mockProjectsState();
        mutations[ProjectsMutations.VersionUploadSuccess](state);

        expect(state.versionTime!.valueOf()).toEqual(testNow);
    });

    it("sets created version as current", () => {
        const state = mockProjectsState({currentProject: mockProject});

        const newVersion = {id: "NEW VERSION", created: "new time", updated: "new time"};
        mutations[ProjectsMutations.VersionCreated](state, {payload: newVersion});

        expect(state.currentVersion).toBe(newVersion);
        expect(state.currentProject!.versions.length).toBe(2);
        expect(state.currentProject!.versions[1]).toBe(newVersion);
    });

    it("clears current version", () => {
        const state = mockProjectsState({currentProject: mockProject, currentVersion: mockProject.versions[0]});

        mutations[ProjectsMutations.ClearCurrentVersion](state);
        expect(state.currentProject).toBeNull();
        expect(state.currentVersion).toBeNull();
    });
});
