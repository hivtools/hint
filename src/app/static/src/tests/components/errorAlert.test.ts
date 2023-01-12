import {shallowMount} from '@vue/test-utils';
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import {mockError} from "../mocks";
import Vuex from "vuex";
import {Language} from "../../app/store/translations/locales";
import registerTranslations from "../../app/store/translations/registerTranslations";

describe("Error alert component", () => {

    const noJobIdProps = {
        error: mockError("Error text")
    };

    const jobIdProps = {
        error: {
            error: "TEST_ERROR_TYPE",
            detail: "Error text",
            job_id: "12345abc"
        }
    };

    const store = new Vuex.Store({
        state: {language: Language.en, updatingLanguage: false}
    });
    registerTranslations(store);

    it("renders error message", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: noJobIdProps,
            store
        });

        expect(wrapper.find(".error-message").text()).toBe("Error text");
        expect(wrapper.find("div").classes()).toStrictEqual(["pt-1", "text-danger"])
        expect(wrapper.findAll("a").length).toBe(0);
        expect(wrapper.findAll(".error-job-id").length).toBe(0);
    });

    it("renders error value if detail is not present", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: {
                error: {
                    error: "TEST ERROR TYPE",
                    detail: null
                }
            },
            store
        });

        expect(wrapper.find(".error-message").text()).toBe("TEST ERROR TYPE");
    });

    it("shows job ID if present", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: jobIdProps,
            store
        });

        expect(wrapper.find(".error-message").text()).toBe("Error text");
        expect(wrapper.find("div").classes()).toStrictEqual(["pt-1", "text-danger"]);
        expect(wrapper.find(".error-job-id").text()).toBe("Job ID: 12345abc");
    });
});
