import {mount, shallowMount} from "@vue/test-utils";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";
import {Language} from "../../../app/store/translations/locales";
import DropDown from "../../../app/components/header/DropDown.vue";

describe("Language menu", () => {

    const createStore = () => {
        return new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations
        });
    };

    it("displays current language", () => {
        const store = createStore();
        const wrapper = shallowMount(LanguageMenu, {
            store
        });
        expect(wrapper.find(DropDown).props("text")).toBe("EN");
    });

    it("changes language", (done) => {
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


});
