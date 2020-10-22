import {createLocalVue, shallowMount} from "@vue/test-utils";
import ResetPassword from "../../../app/components/password/ResetPassword.vue";
import {PasswordState} from "../../../app/store/password/password";
import {PasswordActions} from "../../../app/store/password/actions";
import Vuex, {Store} from "vuex";
import {mockError, mockPasswordState} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import LoggedOutHeader from "../../../app/components/header/LoggedOutHeader.vue";
import {expectTranslatedWithStoreType} from "../../testHelpers";

const localVue = createLocalVue();

describe("Reset password component", () => {

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
            mutations: {},
            getters: {}
        });
        registerTranslations(store);
        return store;
    };

    const createSut = (store: Store<PasswordState>) => {
        return shallowMount(ResetPassword, {
            store, localVue, propsData: {
                token: "testToken",
                title: "Naomi"
            }
        });
    };


    it("renders form with no error", () => {
        const store = createStore({
            passwordWasReset: false,
            resetPasswordError: null
        });

        const wrapper = createSut(store);

        expectTranslatedWithStoreType<PasswordState>(wrapper.find("h3"), "Enter a new password",
            "Veuillez entrer un nouveau mot de passe", store);
        expect((wrapper.find("input[type='password']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("input[type='submit']"),
            "Update password", "Mettre à jour le mot de passe", store, "value");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll("#password-was-reset").length).toEqual(0);
    });

    it("renders form with error", () => {
        const error = mockError("test error");
        const store = createStore({
            passwordWasReset: false,
            resetPasswordError: error
        });

        const wrapper = createSut(store);

        expectTranslatedWithStoreType<PasswordState>(wrapper.find("h3"), "Enter a new password",
            "Veuillez entrer un nouveau mot de passe", store);
        expect((wrapper.find("input[type='password']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("input[type='submit']"),
            "Update password", "Mettre à jour le mot de passe", store, "value");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(1);
        expect(wrapper.find("error-alert-stub").props().error).toBe(error);
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("#request-new-link"),
            "This password reset link is not valid. It may have expired or already been used.\n" +
            "Please request another link here.",
            "Ce lien de réinitialisation du mot de passe n'est pas valide. Il peut avoir expiré ou avoir déjà été utilisé. " +
            "Veuillez cliquer ici pour demander un autre lien.", store);
        expect((wrapper.find("#request-new-link a").element as HTMLLinkElement).href)
            .toEqual("http://localhost/password/forgot-password");
        expect(wrapper.findAll("#password-was-reset").length).toEqual(0);
    });

    it("renders form with password reset success message and hides form", () => {
        const store = createStore({
            passwordWasReset: true,
            resetPasswordError: null
        });

        const wrapper = createSut(store);

        expectTranslatedWithStoreType<PasswordState>(wrapper.find("h3"), "Enter a new password",
            "Veuillez entrer un nouveau mot de passe", store);
        expect(wrapper.findAll("input[type='password']").length).toEqual(0);
        expect(wrapper.findAll("input[type='submit']").length).toEqual(0);
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll("#password-was-reset").length).toEqual(1);
        expectTranslatedWithStoreType<PasswordState>(wrapper.find("#password-was-reset"),
            "Thank you, your password has been updated. Click here to login.",
            "Merci, votre mot de passe a été mis à jour. Cliquez ici pour vous connecter.", store);
    });

    it("invokes resetPassword action", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='password']").setValue("newpassword");
        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.resetPassword.mock.calls.length).toEqual(1);
            expect(actions.resetPassword.mock.calls[0][1]).toEqual({"token": "testToken", "password": "newpassword"});
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });

    it("does not invoke resetPassword action if input value is empty", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.resetPassword.mock.calls.length).toEqual(0);
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });

    it("does not invoke resetPassword action if input value is too short", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='password']").setValue("12345");
        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {

            expect(actions.resetPassword.mock.calls.length).toEqual(0);
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });
    });

    it("passes title to logged out header", () => {
        const store = createStore();
        const wrapper = createSut(store);
        expect(wrapper.find(LoggedOutHeader).props("title")).toBe("Naomi")
    });
});
