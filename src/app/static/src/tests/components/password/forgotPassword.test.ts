import {createLocalVue, shallowMount} from "@vue/test-utils";
import ForgotPassword from "../../../app/components/password/ForgotPassword";
import {PasswordState} from "../../../app/store/password/password";
import {PasswordMutations} from "../../../app/store/password/mutations";
import {PasswordActions} from "../../../app/store/password/actions";
import Vuex, {Store} from "vuex";
import {mockPasswordState} from "../../mocks";
import Vue from "vue";
import {RootState} from "../../../app/main";
import {BaselineActions} from "../../../app/store/baseline/actions";


const localVue = createLocalVue();
Vue.use(Vuex);

describe("Forgot password component", () => {

    let actions: jest.Mocked<PasswordActions>;

    const createStore = (passwordState?: Partial<PasswordState>) => {
        actions = {
            requestResetLink: jest.fn()
        };

        return new Vuex.Store({
            modules: {
                password: {
                    namespaced: true,
                    state: mockPasswordState(passwordState),
                    actions: {...actions},
                    mutations: {}
                }
            }
        })
    };

    const createSut = (store: Store<RootState>) => {
        return shallowMount(ForgotPassword, {store, localVue});
    }


    it("renders form with no error", () => {
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: ""});

        const wrapper = createSut(store);

        expect(wrapper.find("h3").text()).toEqual("Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Request password reset email");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll(".alert-success").length).toEqual(0);
    });

    it("renders form with error", () => {
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: "test error"});

        const wrapper = createSut(store);

        expect(wrapper.find("h3").text()).toEqual("Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Request password reset email");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(1);
        expect(wrapper.find("error-alert-stub").props("message")).toEqual("test error");
        expect(wrapper.findAll(".alert-success").length).toEqual(0);
    });

    it("renders form with request success message", () => {
        const store = createStore({
            resetLinkRequested: true,
            requestResetLinkError: ""});

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
            done();
        });

    });

    it("does not requestLink action if input value is empty", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(0);
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
            done();
        });

    });
});