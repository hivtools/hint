import {mockVersionsState} from "../mocks";
import {mutations, VersionsMutations} from "../../app/store/versions/mutations";

describe("Versions mutations", () => {
    it("sets manageVersions", () => {
        const state = mockVersionsState();

        mutations[VersionsMutations.SetManageVersions](state, {payload: true});
        expect(state.manageVersions).toBe(true);

        mutations[VersionsMutations.SetManageVersions](state, {payload: false});
        expect(state.manageVersions).toBe(false);
    });

    it("sets fake current version", () => {
        const state = mockVersionsState();
        mutations[VersionsMutations.SetManageVersions](state);
        expect(state.currentVersion).toBe("fakeCurrentVersion");
        expect(state.currentSnapshot).toBe("fakeCurrentSnapshot");
    });
});
