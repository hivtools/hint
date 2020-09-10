import Vuex from "vuex";
import {createLocalVue, RouterLinkStub, shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import {Language} from "../../../app/store/translations/locales";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import { getters } from "../../../app/store/root/getters";
import {mockRootState} from "../../mocks";

const localVue = createLocalVue();

const createFrenchStore = () => {
    const frStore = new Vuex.Store({
        state: {language: Language.fr}
    });
    registerTranslations(frStore);
    return frStore;
};

describe("user header", () => {

    const createStore = (partialRootState: Partial<RootState> = {}) => { 
        const store = new Vuex.Store({
                state: mockRootState(partialRootState),
                getters: getters
            });
        registerTranslations(store);
        return store
    }

    const getWrapper = (user: string = "someone@email.com") => {
        const store = createStore({currentUser: user})
        return shallowMount(UserHeader, {propsData: {user, title: "Naomi"}, store, stubs: ["router-link"]});
    };

    it("contains logout link if current user is not guest", () => {
        const wrapper = getWrapper();
        const logoutLink = wrapper.find("a[href='/logout']");
        const loginLink = wrapper.findAll("a[href='/login']");
        expect(logoutLink.text()).toBe("Logout");
        expect(loginLink.length).toBe(0);
    });

    it("contains login info if current user is not guest", () => {
        const wrapper = getWrapper();
        const loginInfo = wrapper.find("span");
        expect(loginInfo.text()).toBe("Logged in as someone@email.com");
    });

    it("contains login link if user is guest", () => {
        const wrapper = getWrapper("guest");
        const logoutLink = wrapper.findAll("a[href='/logout']");
        const loginLink = wrapper.find("a[href='/login']");
        expect(loginLink.text()).toBe("Log In");
        expect(logoutLink.length).toBe(0);
    });

    it("renders file menu", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findAll(FileMenu).length).toBe(1);
    });

    it("renders language menu", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findAll(LanguageMenu).length).toBe(1);
    });

    it("contains bug report link", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        const bugLink = wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7']");
        expect(bugLink.text()).toBe("Report a bug");
    });

    it("computes language", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {localVue, store, stubs: ["router-link"]});
        const vm = (wrapper as any).vm;
        expect(vm.helpFilename).toStrictEqual("Naomi-basic-instructions.pdf");
        expect(vm.troubleFilename).toStrictEqual("index-en.html");

        const frStore = createFrenchStore();
        const frWrapper = shallowMount(UserHeader, {localVue, store: frStore, stubs: ["router-link"]});
        const frVm = (frWrapper as any).vm;
        expect(frVm.helpFilename).toStrictEqual("Naomi-instructions-de-base.pdf");
        expect(frVm.troubleFilename).toStrictEqual("index-fr.html");
    });

    it("contains help document links", () => {
        const store = createStore()
        // Reset translations
        registerTranslations(store);
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.find("a[href='public/resources/Naomi-basic-instructions.pdf']").text()).toBe("Help");
        expect(wrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-en.html']").text()).toBe("Troubleshooting");

        const frStore = createFrenchStore();
        const frWrapper = shallowMount(UserHeader, {store: frStore, stubs: ["router-link"]});
        expect(frWrapper.find("a[href='public/resources/Naomi-instructions-de-base.pdf']").text()).toBe("Aide");
        expect(frWrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html']").text()).toBe("Dépannage");
    });

    it("renders Projects link as expected if user is not guest", () => {
        const wrapper = getWrapper();

        const link = wrapper.find("router-link-stub");
        expect(link.attributes("to")).toBe("/projects");
        expect(link.text()).toBe("Projects");
    });

    it("does not render Projects link if current user is guest", () => {
        const wrapper = getWrapper("guest");
        expect(wrapper.find("#projects-link").exists()).toBe(false);
    });

});
