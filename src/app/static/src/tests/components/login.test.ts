import {shallowMount} from "@vue/test-utils";
import Login from "../../app/components/Login.vue";
import {TranslatableState} from "../../app/types";
import {LanguageActions} from "../../app/store/language/language";
import Vuex, {Store} from "vuex";
import {mockLanguageState} from "../mocks";
import registerTranslations from "../../app/store/translations/registerTranslations";
import LoggedOutHeader from "../../app/components/header/LoggedOutHeader.vue";
import {expectTranslatedWithStoreType} from "../testHelpers";
import {mutations} from "../../app/store/language/mutations";

describe("Login component", () => {

    let actions: jest.Mocked<LanguageActions<TranslatableState>>;

    const createStore = (loginState?: Partial<TranslatableState>) => {
        actions = {
            changeLanguage: jest.fn()
        };

        const store = new Vuex.Store({
            state: mockLanguageState(loginState),
            actions: {...actions},
            mutations
        });

        registerTranslations(store);
        return store;
    };

    const createSut = (store: Store<TranslatableState>, appTitle = "Naomi", continueTo = "/", username = "", error: null | string = null) => {
        return shallowMount(Login, {store, propsData: {title: "login", appTitle, username, continueTo, error}});
    };

    it("renders form with no error", () => {
        const store = createStore();

        const wrapper = createSut(store);

        expect(wrapper.find(LoggedOutHeader).props("title")).toBe("Naomi")

        expect(wrapper.find("h1>strong").text()).toBe("Naomi")

        // Username
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#userid-label"), "Username (email address)",
            "Nom d'utilisateur (adresse e-mail)", "Nome de utilizador (endereço de email)", store);
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#userid-feedback"), "Please enter your username",
            "Veuillez entrer votre nom d’utilisateur", "Por favor, introduza o seu nome de utilizador", store);

        // Password
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#pw-id-label"), "Password",
            "Mot de passe", "Palavra-passe", store);
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#pw-feedback"), "Please enter your password.",
            "Veuillez entrer votre mot de passe.", "Por favor, introduza a sua palavra-passe.", store);
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#forgot-password>a"), "Forgotten your password?",
            "Vous avez oublié votre mot de passe ?", "Esqueceu-se da sua palavra-passe?", store);

        // Log In button
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find(".btn-red"), "Log In",
            "Ouvrir une session", "Iniciar Sessão", store);

        // No account
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#register-an-account>div"), "Don't have an account?",
            "Vous n'avez pas de compte ?", "Não tem uma conta?", store);
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#requestAccount"), "Request an account",
            "Demander un compte", "Solicite uma conta", store);

        // Continue as guest
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#continue-as-guest>div"), "OR",
            "OU", "OU", store);
        expectTranslatedWithStoreType<TranslatableState>(wrapper.find("#continue-as-guest>a"), "Continue as guest",
            "Continuer en tant qu'invité", "Continuar como convidado", store);

        expect(wrapper.find("#error").exists()).toBe(false)

        const links = wrapper.findAll("a")
        expect(links.length).toBe(9)
        expect(links.at(0).attributes("href")).toBe("https://www.unaids.org")
        expect(links.at(0).find("img").attributes("src")).toBe("public/images/unaids_logo.png")

        expect(links.at(1).attributes("href")).toBe("/password/forgot-password/")
        expect(links.at(2).attributes("href")).toBe("https://forms.office.com/r/7S9EMigGr4")
        expect(links.at(3).attributes("href")).toBe("/")

        expect(links.at(4).attributes("href")).toBe("https://www.fjelltopp.org")
        expect(links.at(4).find("img").attributes("src")).toBe("public/images/fjelltopp_logo.png")
        expect(links.at(5).attributes("href")).toBe("https://www.imperial.ac.uk")
        expect(links.at(5).find("img").attributes("src")).toBe("public/images/imperial_logo.png")
        expect(links.at(6).attributes("href")).toBe("https://github.com/reside-ic")
        expect(links.at(6).find("img").attributes("src")).toBe("public/images/reside_logo.png")
        expect(links.at(7).attributes("href")).toBe("https://www.avenirhealth.org")
        expect(links.at(7).find("img").attributes("src")).toBe("public/images/avenir_logo.png")
        expect(links.at(8).attributes("href")).toBe("https://www.washington.edu")
        expect(links.at(8).find("img").attributes("src")).toBe("public/images/uw_logo.png")
    });

    it("renders form with error", () => {
        const store = createStore();

        const wrapper = createSut(store, "Naomi", "/", "", "test error");
        expect(wrapper.find("#error").text()).toBe("test error")
    });

    it("renders correctly for data exploration", () => {
        const store = createStore();

        const wrapper = createSut(store, "Naomi Data Exploration", "explore");

        expect(wrapper.find(LoggedOutHeader).props("title")).toBe("Naomi Data Exploration")

        expect(wrapper.find("h1>strong").text()).toBe("Naomi Data Exploration")

        expect(wrapper.findAll("a").at(3).attributes("href")).toBe("explore")
    });

    it("email is updated from username prop", () => {
        const store = createStore();

        const wrapper = createSut(store, "Naomi", "/", "test");

        expect((wrapper.find("#user-id").element as HTMLInputElement).value).toBe("test");
    });

    it("adds validation class to form when log in", async () => {
        const store = createStore();

        const wrapper = createSut(store);

        expect(wrapper.find("#login-form").attributes("class")).toBe("needs-validation")

        const loginBtn = wrapper.find(".btn-red")
        await loginBtn.trigger("click")
        expect(wrapper.find("#login-form").attributes("class")).toBe("needs-validation was-validated")
    });

    it("continue as guest is set in session storage", async () => {
        const spy = jest.spyOn(Storage.prototype, "setItem");
        const store = createStore();
        const wrapper = createSut(store);

        const guestLink = wrapper.find("#continue-as-guest>a")
        await guestLink.trigger("click")

        expect(spy.mock.calls[0][0]).toBe("asGuest");
        expect(spy.mock.calls[0][1]).toBe("continueAsGuest");
    });

});
