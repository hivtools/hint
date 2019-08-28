import {createLocalVue, shallowMount} from "@vue/test-utils";
import ResetPassword from "../../../app/components/password/ResetPassword";
import {PasswordState} from "../../../app/store/password/password";
import {PasswordActions} from "../../../app/store/password/actions";
import Vuex, {Store} from "vuex";
import {mockPasswordState} from "../../mocks";
import Vue from "vue";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Reset password component", () => {

    let actions: jest.Mocked<PasswordActions>;

    const createStore = (passwordState?: Partial<PasswordState>) => {
        actions = {
            requestResetLink: jest.fn(),
            resetPassword: jest.fn()
        };

        return new Vuex.Store({
            state: mockPasswordState(passwordState),
            actions: {...actions},
            mutations: {}
        });
    };

    const createSut = (store: Store<PasswordState>) => {
        return shallowMount(ResetPassword, {store, localVue, propsData: {
                token: "testToken"
            }});
    };


    it("renders form with no error", () => {
        const store = createStore({
            passwordWasReset: false,
            resetPasswordError: ""});

        const wrapper = createSut(store);

        expect(wrapper.find("h3").text()).toEqual("Enter a new password");
        expect((wrapper.find("input[type='password']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Update password");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll("#password-was-reset").length).toEqual(0);
    });

    it("renders form with error", () => {
        const store = createStore({
            passwordWasReset: false,
            resetPasswordError: "test error"});

        const wrapper = createSut(store);

        expect(wrapper.find("h3").text()).toEqual("Enter a new password");
        expect((wrapper.find("input[type='password']").element as HTMLInputElement).value).toEqual("");
        expect((wrapper.find("input[type='submit']").element as HTMLInputElement).value).toEqual("Update password");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(1);
        expect(wrapper.find("error-alert-stub").props("message")).toEqual("test error");
        expect(wrapper.findAll("#password-was-reset").length).toEqual(0);
    });

    it("renders form with password reset success message and hides form", () => {
        const store = createStore({
            passwordWasReset: true,
            resetPasswordError: ""});

        const wrapper = createSut(store);

        expect(wrapper.find("h3").text()).toEqual("Enter a new password");
        expect(wrapper.findAll("input[type='password']").length).toEqual(0);
        expect(wrapper.findAll("input[type='submit']").length).toEqual(0);
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll("#password-was-reset").length).toEqual(1);
        expect(wrapper.find("#password-was-reset").text()).toEqual("Thank you, your password has been updated. Click here to login.");
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
});