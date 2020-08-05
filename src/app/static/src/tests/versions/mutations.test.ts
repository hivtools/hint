import {mockVersionsState} from "../mocks";
import {mutations, VersionsMutations} from "../../app/store/versions/mutations";

describe("Versions mutations", () => {
    const testNow = Date.now();
    global.Date.now = jest.fn(() => testNow);

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

    it("SnapshotUploadError sets snapshotSuccess and snapshotTime", () => {
        //TODO!!
    });

    it("SnapshotUploadSuccess sets snapshotSuccess and snapshotTime", () => {
        const state = mockVersionsState();
        mutations[VersionsMutations.SnapshotUploadSuccess](state);

        expect(state.snapshotTime!.valueOf()).toEqual(testNow);
    });
});
