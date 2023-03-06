import {mount, shallowMount} from "@vue/test-utils";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import Vuex from "vuex";
import {actions} from "../../../app/store/dataExploration/actions";
import {mutations} from "../../../app/store/dataExploration/mutations";
import {Language} from "../../../app/store/translations/locales";
import DropDown from "../../../app/components/header/DropDown.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {mockDataExplorationState} from "../../mocks";

describe("Language menu", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: mockDataExplorationState(),
            actions: actions,
            mutations: mutations
        });
        registerTranslations(store);
        return store;
    };

    it("displays current language", () => {
        const store = createStore();
        const wrapper = shallowMount(LanguageMenu, {
            store
        });
        expect(wrapper.find(DropDown).props("text")).toBe("EN");
    });

    it("changes language to French", (done) => {
        const store = createStore();
        const wrapper = mount(LanguageMenu, {
            store
        });

        wrapper.findAll(".dropdown-item").at(1).trigger("mousedown");

        setTimeout(() => {
            expect(store.state.language).toBe(Language.fr);
            expect(wrapper.find(DropDown).props("text")).toBe("FR");
            done();
        })
    });

    it("changes language to Portuguese", (done) => {
        const store = createStore();
        const wrapper = mount(LanguageMenu, {
            store
        });

        wrapper.findAll(".dropdown-item").at(2).trigger("mousedown");

        setTimeout(() => {
            expect(store.state.language).toBe(Language.pt);
            expect(wrapper.find(DropDown).props("text")).toBe("PT");
            done();
        })
    });
});
