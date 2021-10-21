import {shallowMount} from "@vue/test-utils";
import ForgotPassword from "../../../app/components/password/ForgotPassword.vue";
import {PasswordState} from "../../../app/store/password/password";
import {PasswordActions} from "../../../app/store/password/actions";
import Vuex, {Store} from "vuex";
import {mockError, mockPasswordState} from "../../mocks";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import LoggedOutHeader from "../../../app/components/header/LoggedOutHeader.vue";
import {expectTranslatedWithStoreType} from "../../testHelpers";
import {LanguageMutation, mutations} from "../../../app/store/language/mutations";
import {Language} from "../../../app/store/translations/locales";

describe("Forgot password component", () => {

    let actions: jest.Mocked<PasswordActions>;

    const createStore = (passwordState?: Partial<PasswordState>) => {
        actions = {
            requestResetLink: jest.fn(),
            resetPassword: jest.fn(),
            changeLanguage: jest.fn()
        };

        const store = new Vuex.Store({
            state: mockPasswordState(passwordState),
            actions: {...actions},
            mutations
        });

        registerTranslations(store);
        return store;
    };

    const createSut = (store: Store<PasswordState>) => {
        return shallowMount(ForgotPassword, {store, propsData: {title: "Naomi"}});
    };

    it("renders form with no error", () => {
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: null
        });

        const wrapper = createSut(store);

        expectTranslatedWithStoreType<PasswordState>(wrapper.find("h3"), "Forgotten your password?",
            "Vous avez oublié votre mot de passe ?", "Esqueceu-se da sua palavra-passe?", store);
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("input[type='email']"), "Email address",
            "Adresse e-mail", "Endereço de e-mail", store, "placeholder");
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("input[type='submit']"),
            "Request password reset email", "Demande de réinitialisation du mot de passe par e-mail",
            "Solicitar e-mail de reposição de palavra-passe", store, "value");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll(".alert-success").length).toEqual(0);
    });

    it("renders form with error", () => {
        const error = mockError("test error");
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: error
        });

        const wrapper = createSut(store);

        expectTranslatedWithStoreType<PasswordState>(wrapper.find("h3"), "Forgotten your password?",
            "Vous avez oublié votre mot de passe ?", "Esqueceu-se da sua palavra-passe?", store);
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("input[type='submit']"),
            "Request password reset email", "Demande de réinitialisation du mot de passe par e-mail",
            "Solicitar e-mail de reposição de palavra-passe", store, "value");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(1);
        expect(wrapper.find(ErrorAlert).props().error).toBe(error);
        expect(wrapper.findAll(".alert-success").length).toEqual(0);
    });

    it("renders form with request success message", () => {
        const store = createStore({
            resetLinkRequested: true,
            requestResetLinkError: null
        });

        const wrapper = createSut(store);

        expectTranslatedWithStoreType<PasswordState>(wrapper.find("h3"), "Forgotten your password?",
            "Vous avez oublié votre mot de passe ?", "Esqueceu-se da sua palavra-passe?", store);
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("input[type='submit']"),
            "Request password reset email", "Demande de réinitialisation du mot de passe par e-mail",
            "Solicitar e-mail de reposição de palavra-passe", store, "value");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll(".alert-success").length).toEqual(1);
        expectTranslatedWithStoreType<PasswordState>(wrapper.find(".alert-success"),
            "Thank you. If we have an account registered for this email address, you will receive a password reset link.",
            "Merci. Si un compte est enregistré pour cette adresse e-mail, vous recevrez un lien de réinitialisation du mot de passe.",
            "Obrigado. Se tivermos uma conta registada para este endereço de e-mail, receberá uma ligação de reposição de palavra-passe.",
            store);
    });

    it("invokes requestResetLink action", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='email']").setValue("test@email.com");
        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(1);
            expect(actions.requestResetLink.mock.calls[0][1]).toEqual("test@email.com");
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });

    it("does not requestLink action if input value is empty", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(0);
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });

    it("does not requestLink action if input value is not email address", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='email']").setValue("test");
        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(0);
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });

    it("passes title to logged out header", () => {
        const store = createStore();
        const wrapper = createSut(store);
        expect(wrapper.find(LoggedOutHeader).props("title")).toBe("Naomi")
    });

    it("updates html lang when language changes", () => {
        const store = createStore();
        createSut(store);
        store.commit(LanguageMutation.ChangeLanguage, {payload: Language.pt});
        expect(document.documentElement.lang).toBe("pt");
    });

});
