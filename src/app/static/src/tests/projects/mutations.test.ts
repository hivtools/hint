import {mockProjectsState} from "../mocks";
import {mutations, ProjectsMutations} from "../../app/store/projects/mutations";

describe("Projects mutations", () => {
    const testNow = Date.now();
    global.Date.now = jest.fn(() => testNow);

    const consoleSpy = jest.fn();

    beforeEach(() => {
        console.error = consoleSpy;
    });

    afterEach(() => {
        (console.error as jest.Mock).mockClear();
    });

    it("sets loading", () => {
        const state = mockProjectsState();

        mutations[ProjectsMutations.SetLoading](state, {payload: true});
        expect(state.loading).toBe(true);

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

    it("sets snapshot upload pending", () => {
        const state = mockProjectsState();
        mutations[ProjectsMutations.SetSnapshotUploadPending](state, {payload: true});
        expect(state.snapshotUploadPending).toBe(true);
    });

    it("SnapshotUploadSuccess sets snapshotTime", () => {
        const state = mockProjectsState();
        mutations[ProjectsMutations.SnapshotUploadSuccess](state);

        expect(state.snapshotTime!.valueOf()).toEqual(testNow);
    });

    it("sets created snapshot as current", () => {
        const mockProject = {
            id: 1,
            name: "v1",
            snapshots: [{id: "OLD SNAPSHOT", created: "old created time", updated: "old updated time"}]
        };
        const state = mockProjectsState({currentProject: mockProject});

        const newSnapshot = {id: "NEW SNAPSHOT", created: "new time", updated: "new time"};
        mutations[ProjectsMutations.SnapshotCreated](state, {payload: newSnapshot});

        expect(state.currentSnapshot).toBe(newSnapshot);
        expect(state.currentProject!.snapshots.length).toBe(2);
        expect(state.currentProject!.snapshots[1]).toBe(newSnapshot);
    });
});
