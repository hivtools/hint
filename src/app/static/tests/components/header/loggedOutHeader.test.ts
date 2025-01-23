import Vuex from "vuex";
import {shallowMount} from "@vue/test-utils";
import LoggedOutHeader from "../../../src/components/header/LoggedOutHeader.vue";
import LanguageMenu from "../../../src/components/header/LanguageMenu.vue";
import {emptyState} from "../../../src/root";
import registerTranslations from "../../../src/store/translations/registerTranslations";
import {shallowMountWithTranslate} from "../../testHelpers";

describe("logged out header", () => {

    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("contains title", () => {
        const wrapper = shallowMountWithTranslate(LoggedOutHeader, store, {
            global: {
                plugins: [store]
            }, props: {title: "AppTitle"}
        });
        const title = wrapper.find(".navbar-header");
        expect(title.text()).toBe("AppTitle");
    });

    it("renders language menu", () => {
        const wrapper = shallowMount(LoggedOutHeader);
        expect(wrapper.findAllComponents(LanguageMenu).length).toBe(1);
    });

});
