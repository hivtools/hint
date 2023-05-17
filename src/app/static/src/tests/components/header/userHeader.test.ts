import Vuex, {Store} from "vuex";
import {createLocalVue, shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";
import {Language} from "../../../app/store/translations/locales";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {getters} from "../../../app/store/root/getters";
import {mockRootState} from "../../mocks";
import {expectTranslated} from "../../testHelpers";
import OnlineSupportMenu from "../../../app/components/header/OnlineSupportMenu.vue";

const localVue = createLocalVue();

const createLanguageStore = (language: Language) => {
    const store = new Vuex.Store({
        state: {
            ...emptyState(),
            language
        },
        getters: getters
    });
    registerTranslations(store);
    return store;
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
            props: {user, title: "Naomi"},
            store: store || createStore({currentUser: user}),
            stubs: ["router-link"]
        });
    };

    it("contains logout link if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.findComponent("a[href='/logout']");
        const loginLink = wrapper.findAllComponents("a[href='/login']");
        expectTranslated(logoutLink, "Logout", "Fermer une session", "Sair", store);
        expect(loginLink.length).toBe(0);
    });

    it("contains login info if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const loginInfo = wrapper.findComponent("span");
        expectTranslated(loginInfo, "Logged in as someone@email.com",
            "Connecté en tant que someone@email.com", "Sessão iniciada como someone@email.com", store);
    });

    it("contains login link if user is guest", () => {
        const currentUser = "guest";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.findAllComponents("a[href='/logout']");
        const loginLink = wrapper.findComponent("a[href='/login']");
        expectTranslated(loginLink, "Log In", "Ouvrir une session", "Iniciar Sessão", store);
        expect(logoutLink.length).toBe(0);
    });

    it("renders file menu", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findAllComponents(FileMenu).length).toBe(1);
    });

    it("renders language menu", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findAllComponents(LanguageMenu).length).toBe(1);
    });

    it("renders hintr version and online support menu", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findAllComponents(HintrVersionMenu).length).toBe(1);
        expect(wrapper.findAllComponents(OnlineSupportMenu).length).toBe(1);
    })

    it("computes help filename", () => {
        const store = createStore()
        const wrapper = shallowMount(UserHeader, {localVue, store, stubs: ["router-link"]});
        const vm = (wrapper as any).vm;
        expect(vm.helpFilename).toStrictEqual(
            "https://hivtools.unaids.org/wp-content/uploads/75D-Guide-5-Naomi-quick-start.pdf");

        const frStore = createLanguageStore(Language.fr);
        const frWrapper = shallowMount(UserHeader, {localVue, store: frStore, stubs: ["router-link"]});
        const frVm = (frWrapper as any).vm;
        expect(frVm.helpFilename).toStrictEqual(
            "https://hivtools.unaids.org/wp-content/uploads/75D-Instructions-pour-Naomi.pdf");

        const ptStore = createLanguageStore(Language.pt);
        const ptWrapper = shallowMount(UserHeader, {localVue, store: ptStore, stubs: ["router-link"]});
        const ptVm = (ptWrapper as any).vm;
        expect(ptVm.helpFilename).toStrictEqual(
            "https://hivtools.unaids.org/wp-content/uploads/75D-Guide-5-Naomi-quick-start.pdf");
    });

    it("contains Basic steps document links", () => {
        const store = createStore();
        const wrapper = shallowMount(UserHeader, {store, stubs: ["router-link"]});
        expect(wrapper.findComponent(
            "a[href='https://hivtools.unaids.org/wp-content/uploads/75D-Guide-5-Naomi-quick-start.pdf']"
            ).text()).toBe("Basic steps");

        const frStore = createLanguageStore(Language.fr);
        const frWrapper = shallowMount(UserHeader, {store: frStore, stubs: ["router-link"]});
        expect(frWrapper.findComponent(
            "a[href='https://hivtools.unaids.org/wp-content/uploads/75D-Instructions-pour-Naomi.pdf']"
            ).text()).toBe("Etapes de base");

        const ptStore = createLanguageStore(Language.pt);
        const ptWrapper = shallowMount(UserHeader, {store: ptStore, stubs: ["router-link"]});
        expect(ptWrapper.findComponent(
            "a[href='https://hivtools.unaids.org/wp-content/uploads/75D-Guide-5-Naomi-quick-start.pdf']"
            ).text()).toBe("Passos básicos");
    });

    it("renders Projects link as expected if user is not guest", () => {
        const store = createStore();
        const wrapper = getWrapper("someone@email.com", store);

        const link = wrapper.findComponent("router-link-stub");
        expect(link.attributes("to")).toBe("/projects");
        expectTranslated(link, "Projects", "Projets", "Projetos", store);
    });

    it("does not render Projects link if current user is guest", () => {
        const wrapper = getWrapper("guest");
        expect(wrapper.findComponent("#projects-link").exists()).toBe(false);
    });

    it('can render header title', () => {
        const wrapper = getWrapper()
        const title = wrapper.findComponent(".navbar-header")
        expect(title.classes()).toEqual(["navbar-header"])
        expect(title.text()).toBe("Naomi")
    });

});
