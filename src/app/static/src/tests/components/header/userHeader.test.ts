import Vuex, {Store} from "vuex";
import {createLocalVue, RouterLinkStub, shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";
import {Language} from "../../../app/store/translations/locales";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import { getters } from "../../../app/store/root/getters";
import {mockRootState} from "../../mocks";
import {expectTranslated} from "../../testHelpers";

const localVue = createLocalVue();

const createFrenchStore = () => {
    const frStore = new Vuex.Store({
        state: {
            ...emptyState(),
            language: Language.fr
        },
        getters: getters
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

    const getWrapper = (user: string = "someone@email.com", store?: Store<RootState>) => {
        return shallowMount(UserHeader, {
            propsData: {user, title: "Naomi"},
            store: store || createStore({currentUser: user}),
            stubs: ["router-link"]});
    };

    it("contains logout link if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.find("a[href='/logout']");
        const loginLink = wrapper.findAll("a[href='/login']");
        expectTranslated(logoutLink, "Logout", "Fermer une session", store);
        expect(loginLink.length).toBe(0);
    });

    it("contains login info if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const loginInfo = wrapper.find("span");
        expectTranslated(loginInfo,"Logged in as someone@email.com",
            "Connecté en tant que someone@email.com", store);
    });

    it("contains login link if user is guest", () => {
        const currentUser = "guest";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.findAll("a[href='/logout']");
        const loginLink = wrapper.find("a[href='/login']");
        expectTranslated(loginLink, "Log In", "Ouvrir une session", store);
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

    it("renders hintr version menu", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findAll(HintrVersionMenu).length).toBe(1);
    })

    it("contains bug report link", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        const bugLink = wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7']");
        expectTranslated(bugLink, "Report a bug", "Signaler un bogue", store);
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
        const store = createStore();
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.find("a[href='public/resources/Naomi-basic-instructions.pdf']").text()).toBe("Help");
        expect(wrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-en.html']").text()).toBe("Troubleshooting");

        const frStore = createFrenchStore();
        const frWrapper = shallowMount(UserHeader, {store: frStore, stubs: ["router-link"]});
        expect(frWrapper.find("a[href='public/resources/Naomi-instructions-de-base.pdf']").text()).toBe("Aide");
        expect(frWrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html']").text()).toBe("Dépannage");
    });

    it("renders Projects link as expected if user is not guest", () => {
        const store = createStore();
        const wrapper = getWrapper("someone@email.com", store);

        const link = wrapper.find("router-link-stub");
        expect(link.attributes("to")).toBe("/projects");
        expectTranslated(link, "Projects", "Projets", store);
    });

    it("does not render Projects link if current user is guest", () => {
        const wrapper = getWrapper("guest");
        expect(wrapper.find("#projects-link").exists()).toBe(false);
    });

});
