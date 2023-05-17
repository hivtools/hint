import Vuex, {Store} from "vuex";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import DataExplorationHeader from "../../../app/components/header/DataExplorationHeader.vue"
import {getters} from "../../../app/store/dataExploration/getters";
import {mockDataExplorationState} from "../../mocks";
import {expectTranslatedWithStoreType} from "../../testHelpers";
import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";
import {DataExplorationState} from "../../../app/store/dataExploration/dataExploration";
import {Language} from "../../../app/store/translations/locales";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";

describe(`Data Exploration header`, () => {

    const createStore = (partialState: Partial<DataExplorationState> = {}) => {
        const store = new Vuex.Store({
            state: mockDataExplorationState(partialState),
            getters: getters
        });
        registerTranslations(store);
        return store
    }

    const getWrapper = (user: string = "someone@email.com", store?: Store<DataExplorationState>) => {
        return shallowMount(DataExplorationHeader, {
            props: {user, title: "Naomi Data Exploration"},
            store: store || createStore({currentUser: user})
        })
    }

    it('can render header title', () => {
        const wrapper = getWrapper()
        const title = wrapper.findComponent(".navbar-header-secondary")
        expect(title.classes()).toEqual(["navbar-header-secondary"])
        expect(title.text()).toBe("Naomi Data Exploration")
    });

    it(`renders help file correctly`, () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const helpFile = wrapper.findComponent("#helpFile")
        expect(helpFile.attributes("href")).toBe(
            "https://hivtools.unaids.org/wp-content/uploads/75D-Guide-5-Naomi-quick-start.pdf")
        wrapper.vm.$store.state.language = Language.fr
        expect(helpFile.attributes("href")).toBe(
            "https://hivtools.unaids.org/wp-content/uploads/75D-Instructions-pour-Naomi.pdf")
        expectTranslatedWithStoreType(helpFile, "Help", "Aider", "Ajuda", store)
    })

    it("contains logout link if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.findComponent("a[href='/logout']");
        const loginLink = wrapper.findAllComponents("a[href='/login?redirectTo=explore']");
        expectTranslatedWithStoreType(logoutLink, "Logout", "Fermer une session", "Sair", store);
        expect(loginLink.length).toBe(0);
    });

    it("contains login info if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const loginInfo = wrapper.findComponent("span");
        expectTranslatedWithStoreType(loginInfo, "Logged in as someone@email.com",
            "Connecté en tant que someone@email.com", "Sessão iniciada como someone@email.com", store);
    });

    it("renders language menu", () => {
        const wrapper = getWrapper()
        expect(wrapper.findComponent(LanguageMenu).exists()).toBe(true)
    });

    it("renders hintr version", () => {
        const wrapper = getWrapper()
        expect(wrapper.findComponent(HintrVersionMenu).exists()).toBe(true);
    })

    it("renders Run model link as expected", () => {
        const store = createStore();
        const wrapper = getWrapper("someone@email.com", store);

        expect(wrapper.findComponent("a").attributes("href")).toBe("/")
        expectTranslatedWithStoreType(wrapper.findComponent("a"),
            "Run model", "Exécuter le modèle",
            "Executar modelo", store)
    });
})