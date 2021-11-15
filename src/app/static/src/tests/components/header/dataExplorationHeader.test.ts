import Vuex, {Store} from "vuex";
import {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import DataExplorationHeader from "../../../app/components/header/DataExplorationHeader.vue"
import {getters} from "../../../app/store/root/getters";
import {mockRootState} from "../../mocks";
import {expectTranslated} from "../../testHelpers";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";

describe(`Data Exploration header`, () => {

    const createStore = (partialRootState: Partial<RootState> = {}) => {
        const store = new Vuex.Store({
            state: mockRootState(partialRootState),
            getters: getters
        });
        registerTranslations(store);
        return store
    }

    const getWrapper = (user: string = "someone@email.com", store?: Store<RootState>) => {
        return shallowMount(DataExplorationHeader, {
            propsData: {user, title: "Naomi Data Exploration"},
            store: store || createStore({currentUser: user}),
            stubs: ["router-link"]
        })
    }

    it('can render header title', () => {
        const wrapper = getWrapper()
        const d = wrapper.find(".navbar-header")
        expect(d.text()).toBe("Naomi Data Exploration")
    });

    it("contains logout link if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.find("a[href='/logout']");
        const loginLink = wrapper.findAll("a[href='/login']");
        expectTranslated(logoutLink, "Logout", "Fermer une session", "Sair", store);
        expect(loginLink.length).toBe(0);
    });

    it("contains login info if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const loginInfo = wrapper.find("span");
        expectTranslated(loginInfo, "Logged in as someone@email.com",
            "Connecté en tant que someone@email.com", "Sessão iniciada como someone@email.com", store);
    });

    it("renders language menu", () => {
        const wrapper = getWrapper()
        expect(wrapper.findAll(LanguageMenu).length).toBe(1);
    });

    it("renders hintr version and online support menu", () => {
        const wrapper = getWrapper()
        expect(wrapper.findAll(HintrVersionMenu).length).toBe(1);
    })

    it("renders Run model link as expected", () => {
        const store = createStore();
        const wrapper = getWrapper("someone@email.com", store);
        expect(wrapper.find("a").attributes("href")).toBe("/")
    });
})