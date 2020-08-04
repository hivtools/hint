import {mockVersionsState} from "../mocks";
import {mutations, VersionsMutations} from "../../app/store/versions/mutations";

describe("Versions mutations", () => {
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

    it("SnapshotUploadError logs error to console", () => {
        const consoleSpy = jest.spyOn(console, 'error');

        const state = mockVersionsState();
        mutations[VersionsMutations.SnapshotUploadError](state, {payload: "test error"});

        expect(consoleSpy).toHaveBeenCalledWith("test error");
    });
});
