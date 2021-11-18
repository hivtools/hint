import Vuex, {Store} from "vuex";
import {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import DataExplorationHeader from "../../../app/components/header/DataExplorationHeader.vue"
import {getters} from "../../../app/store/root/getters";
import {mockRootState} from "../../mocks";
import {expectTranslated, expectTranslatedWithStoreType} from "../../testHelpers";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";
import OnlineSupportMenu from "../../../app/components/header/OnlineSupportMenu.vue";
import {Language} from "../../../app/store/translations/locales";

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
            store: store || createStore({currentUser: user})
        })
    }

    it('can render header title', () => {
        const wrapper = getWrapper()
        const title = wrapper.find(".navbar-header")
        expect(title.text()).toBe("Naomi Data Exploration")
    });

    it(`renders help file correctly`, () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const helpFile = wrapper.find("#helpFile")
        expect(helpFile.attributes("href")).toBe("public/resources/Naomi-basic-instructions.pdf")
        expectTranslated(helpFile, "Help", "Aider", "Ajuda", store)
    })

    it("contains logout link if current user is not guest", () => {
        const currentUser = "someone@email.com";
        const store = createStore({currentUser});
        const wrapper = getWrapper(currentUser, store);
        const logoutLink = wrapper.find("a[href='/logout']");
        const loginLink = wrapper.findAll("a[href='/login?redirectTo=explore']");
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

    it("renders hintr version", () => {
        const wrapper = getWrapper()
        expect(wrapper.findAll(HintrVersionMenu).length).toBe(1);
    })

    it("renders Run model link as expected", () => {
        const store = createStore();
        const wrapper = getWrapper("someone@email.com", store);

        expect(wrapper.find("a").attributes("href")).toBe("/")
        expectTranslatedWithStoreType(wrapper.find("a"),
            "Run model", "Exécuter le modèle",
            "Executar modelo", store)
    });
})