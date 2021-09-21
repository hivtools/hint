import {mount, shallowMount} from "@vue/test-utils";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";
import {Language} from "../../../app/store/translations/locales";
import DropDown from "../../../app/components/header/DropDown.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("Language menu", () => {
    const mockPlottingMetadata= jest.fn()

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations,
            modules: {
                metadata: {
                    namespaced: true,
                    actions: {
                        getPlottingMetadata: mockPlottingMetadata
                    }
                }
            },

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
        const mockHandleChangeLanguage = jest.fn()
        const store = createStore();
        const wrapper = mount(LanguageMenu, {
            store
        });

        wrapper.findAll(".dropdown-item").at(1).trigger("mousedown");
        setTimeout(() => {
            expect(mockPlottingMetadata.mock.calls.length).toBe(1)
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
