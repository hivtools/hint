import Vuex from "vuex";
import {createLocalVue, shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import {Language} from "../../../app/store/translations/locales";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {initialVersionsState} from "../../../app/store/versions/versions";

const localVue = createLocalVue();

const createFrenchStore = () => {
    const frStore = new Vuex.Store({
        state: {language: Language.fr}
    });
    registerTranslations(frStore);
    return frStore;
};

describe("user header", () => {

    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    const getWrapper = (user: string = "someone@email.com") => {
        return shallowMount(UserHeader, {propsData: {user, title: "Naomi"}, store});
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
        const wrapper = shallowMount(UserHeader, {store});
        expect(wrapper.findAll(FileMenu).length).toBe(1);
    });

    it("renders language menu", () => {
        const wrapper = shallowMount(UserHeader, {store});
        expect(wrapper.findAll(LanguageMenu).length).toBe(1);
    });

    it("contains bug report link", () => {
        const wrapper = shallowMount(UserHeader, {store});
        const bugLink = wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7']");
        expect(bugLink.text()).toBe("Report a bug");
    });

    it("computes language", () => {
        const wrapper = shallowMount(UserHeader, {localVue, store});
        const vm = (wrapper as any).vm;
        expect(vm.helpFilename).toStrictEqual("Naomi-basic-instructions.pdf");
        expect(vm.troubleFilename).toStrictEqual("index-en.html");

        const frStore = createFrenchStore();
        const frWrapper = shallowMount(UserHeader, {localVue, store: frStore});
        const frVm = (frWrapper as any).vm;
        expect(frVm.helpFilename).toStrictEqual("Naomi-instructions-de-base.pdf");
        expect(frVm.troubleFilename).toStrictEqual("index-fr.html");
    });

    it("contains help document links", () => {
        // Reset translations
        registerTranslations(store);
        const wrapper = shallowMount(UserHeader, {store});
        expect(wrapper.find("a[href='public/resources/Naomi-basic-instructions.pdf']").text()).toBe("Help");
        expect(wrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-en.html']").text()).toBe("Troubleshooting");

        const frStore = createFrenchStore();
        const frWrapper = shallowMount(UserHeader, {store: frStore});
        expect(frWrapper.find("a[href='public/resources/Naomi-instructions-de-base.pdf']").text()).toBe("Aide");
        expect(frWrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html']").text()).toBe("Dépannage");
    });

    it("renders Versions link if user is not guest", () => {
        const wrapper = getWrapper();
        expect(wrapper.find("#versions-link").text()).toBe("Versions");
    });

    it("does not render Versions link if current user is guest", () => {
        const wrapper = getWrapper("guest");
        expect(wrapper.find("#versions-link").exists()).toBe(false);
    });

    it("clicking Versions link sets manageVersions", () => {
        const mockSetManageVersions = jest.fn();
        const versionsStore = new Vuex.Store({
            modules: {
                versions: {
                    namespaced: true,
                    state: initialVersionsState(),
                    mutations: {
                        SetManageVersions: mockSetManageVersions
                    }
                }
            }
        });
        const wrapper =  shallowMount(UserHeader, {propsData: {user: "testUser"}, store: versionsStore});
        wrapper.find("#versions-link").trigger("click");
        expect(mockSetManageVersions.mock.calls.length).toBe(1);
        expect(mockSetManageVersions.mock.calls[0][1].payload).toBe(true);
    });

});
