import {mount, shallowMount} from "@vue/test-utils";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import Vuex from "vuex";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";
import {Language} from "../../../app/store/translations/locales";
import DropDown from "../../../app/components/header/DropDown.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {mockRootState} from "../../mocks";

describe("Language menu", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: mockRootState(),
            actions: actions,
            mutations: mutations
        });
        registerTranslations(store);
        return store;
    };

    it("displays current language", () => {
        const store = createStore();
        const wrapper = shallowMount(LanguageMenu, {
            global: {
                plugins: [store]
            }
        });
        expect(wrapper.findComponent(DropDown).props("text")).toBe("EN");
    });

    it("changes language to French", async () => {
        const store = createStore();
        const wrapper = mount(LanguageMenu, {
            global: {
                plugins: [store]
            }
        });

        await wrapper.findAll(".dropdown-item")[1].trigger("mousedown");

        expect(store.state.language).toBe(Language.fr);
        expect(wrapper.findComponent(DropDown).props("text")).toBe("FR");
    });

    it("changes language to Portuguese", async () => {
        const store = createStore();
        const wrapper = mount(LanguageMenu, {
            global: {
                plugins: [store]
            }
        });

        await wrapper.findAll(".dropdown-item")[2].trigger("mousedown");

        expect(store.state.language).toBe(Language.pt);
        expect(wrapper.findComponent(DropDown).props("text")).toBe("PT");
    });
});
