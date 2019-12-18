import Vuex from "vuex";
import {shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("user header", () => {

    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("contains logout link", () => {
        const wrapper = shallowMount(UserHeader, {store});
        const logoutLink = wrapper.find("a[href='/logout']");
        expect(logoutLink.text()).toBe("Logout");
    });

    it("renders file menu", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.findAll(FileMenu).length).toBe(1);
    });

    it("renders language menu", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.findAll(LanguageMenu).length).toBe(1);
    });

    it("contains bug report link", () => {
        const wrapper = shallowMount(UserHeader, {store});
        const bugLink = wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7']");
        expect(bugLink.text()).toBe("Report a bug");
    });
});
