import {mockDataExplorationState} from "../mocks";
import {LanguageMutation} from "../../app/store/language/mutations";
import {mutations} from "../../app/store/dataExploration/mutations";

describe("data exploration mutations", () => {

    it("can change language", () => {
        const state = mockDataExplorationState();
        mutations[LanguageMutation.ChangeLanguage](state, {payload: "fr"});
        expect(state.language).toBe("fr");
    });

    it("can set updatingLanguage", () => {
        const state = mockDataExplorationState();
        mutations.SetUpdatingLanguage(state, {payload: true});
        expect(state.updatingLanguage).toBe(true);

        mutations.SetUpdatingLanguage(state, {payload: false});
        expect(state.updatingLanguage).toBe(false);
    });
});
