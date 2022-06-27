import {shallowMount} from "@vue/test-utils";
import Login from "../../app/components/Login.vue";
import {LoginState} from "../../app/store/login/login";
import {LoginActions} from "../../app/store/login/actions";
import Vuex, {Store} from "vuex";
import {mockError, mockLoginState} from "../mocks";
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import registerTranslations from "../../app/store/translations/registerTranslations";
import LoggedOutHeader from "../../app/components/header/LoggedOutHeader.vue";
import {expectTranslatedWithStoreType} from "../testHelpers";
import {LanguageMutation, mutations} from "../../app/store/language/mutations";
import {Language} from "../../app/store/translations/locales";

describe("Login component", () => {

    let actions: jest.Mocked<LoginActions>;

    const createStore = (loginState?: Partial<LoginState>) => {
        actions = {
            loginRequest: jest.fn(),
            changeLanguage: jest.fn()
        };

        const store = new Vuex.Store({
            state: mockLoginState(loginState),
            actions: {...actions},
            mutations
        });

        registerTranslations(store);
        return store;
    };

    const createSut = (store: Store<LoginState>) => {
        return shallowMount(Login, {store, propsData: {title: "login", appTitle: "Naomi", username: "", continueTo: "/", error: null}});
    };

    it("renders form with no error", () => {
        const store = createStore({
            loginRequested: false,
            loginRequestError: null
        });

        const wrapper = createSut(store);

        expect(wrapper.find(LoggedOutHeader).props("title")).toBe("Naomi")

        expect(wrapper.find("h1>strong").text()).toBe("Naomi")

        // Username
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#userid-label"), "Username (email address)",
            "Nom d'utilisateur (adresse e-mail)", "Nome de utilizador (endereço de email)", store);
        // expect(wrapper.find("#user-id").text()).toBe("test@email.com")
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#userid-feedback"), "Please enter your username",
            "Veuillez entrer votre nom d’utilisateur", "Por favor, introduza o seu nome de utilizador", store);

        // Password
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#pw-id-label"), "Password",
            "Mot de passe", "Palavra-passe", store);
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#pw-feedback"), "Please enter your password.",
            "Veuillez entrer votre mot de passe.", "Por favor, introduza a sua palavra-passe.", store);
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#forgot-password>a"), "Forgotten your password?",
            "Vous avez oublié votre mot de passe ?", "Esqueceu-se da sua palavra-passe?", store);

        // Log In button
        expectTranslatedWithStoreType<LoginState>(wrapper.find(".btn-red"), "Log In",
            "Ouvrir une session", "Iniciar Sessão", store);

        // No account
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#register-an-account>div"), "Don't have an account?",
            "Vous n'avez pas de compte ?", "Não tem uma conta?", store);
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#requestAccount"), "Request an account",
            "Demander un compte", "Solicite uma conta", store);

        // Continue as guest
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#continue-as-guest>div"), "OR",
            "OU", "OU", store);
        expectTranslatedWithStoreType<LoginState>(wrapper.find("#continue-as-guest>a"), "Continue as guest",
            "Continuer en tant qu'invité", "Continuar como convidado", store);


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

});
