import {mockVersionsState} from "../mocks";
import {mutations, VersionsMutations} from "../../app/store/projects/mutations";

describe("Versions mutations", () => {
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
        const state = mockVersionsState();

        mutations[VersionsMutations.SetLoading](state, {payload: true});
        expect(state.loading).toBe(true);

        mutations[VersionsMutations.SetLoading](state, {payload: false});
        expect(state.loading).toBe(false);
    });

    it("sets error", () => {
        const state = mockVersionsState({loading: true});

        const error = {error: "error", detail: "detail"};
        mutations[VersionsMutations.VersionError](state, {payload: error});

        expect(state.error).toBe(error);
        expect(state.loading).toBe(false);
    });

    it("sets previous versions", () => {
        const state = mockVersionsState({loading: true});
        mutations[VersionsMutations.SetPreviousVersions](state, {payload: ["TEST VERSION"]});

        expect(state.previousVersions).toStrictEqual(["TEST VERSION"]);
        expect(state.loading).toBe(false);
    });

    it("sets snapshot upload pending", () => {
        const state = mockVersionsState();
        mutations[VersionsMutations.SetSnapshotUploadPending](state, {payload: true});
        expect(state.snapshotUploadPending).toBe(true);
    });

    it("SnapshotUploadSuccess sets snapshotTime", () => {
        const state = mockVersionsState();
        mutations[VersionsMutations.SnapshotUploadSuccess](state);

        expect(state.snapshotTime!.valueOf()).toEqual(testNow);
    });

    it("sets created snapshot as current", () => {
        const mockVersion = {
            id: 1,
            name: "v1",
            snapshots: [{id: "OLD SNAPSHOT", created: "old created time", updated: "old updated time"}]
        };
        const state = mockVersionsState({currentVersion: mockVersion});

        const newSnapshot = {id: "NEW SNAPSHOT", created: "new time", updated: "new time"};
        mutations[VersionsMutations.SnapshotCreated](state, {payload: newSnapshot});

        expect(state.currentSnapshot).toBe(newSnapshot);
        expect(state.currentVersion!.snapshots.length).toBe(2);
        expect(state.currentVersion!.snapshots[1]).toBe(newSnapshot);
    });
});
