import {shallowMount} from "@vue/test-utils";
import ForgotPassword from "../../../app/components/password/ForgotPassword.vue";
import {PasswordState} from "../../../app/store/password/password";
import {PasswordActions} from "../../../app/store/password/actions";
import Vuex, {Store} from "vuex";
import {mockError, mockPasswordState} from "../../mocks";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import LoggedOutHeader from "../../../app/components/header/LoggedOutHeader.vue";

describe("Forgot password component", () => {

    let actions: jest.Mocked<PasswordActions>;

    const createStore = (passwordState?: Partial<PasswordState>) => {
        actions = {
            requestResetLink: jest.fn(),
            resetPassword: jest.fn()
        };

        const store = new Vuex.Store({
            state: mockPasswordState(passwordState),
            actions: {...actions},
            mutations: {}
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

        expect(wrapper.find("h3").text()).toEqual("Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).placeholder).toEqual("Email address");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Request password reset email");
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

        expect(wrapper.find("h3").text()).toEqual("Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Request password reset email");
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

        expect(wrapper.find("h3").text()).toEqual("Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Request password reset email");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll(".alert-success").length).toEqual(1);
        expect(wrapper.find(".alert-success").text()).toEqual("Thank you. If we have an account registered for this email address, you wil receive a password reset link.");
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
});