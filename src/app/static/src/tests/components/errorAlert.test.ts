import {shallowMount} from '@vue/test-utils';
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import {mockError} from "../mocks";
import Vuex from "vuex";
import {Language} from "../../app/store/translations/locales";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {expectTranslated} from "../testHelpers";

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
            props: noJobIdProps,
            store
        });

        expect(wrapper.findComponent(".error-message").text()).toBe("Error text");
        expect(wrapper.findComponent("div").classes()).toStrictEqual(["pt-1", "text-danger"])
        expect(wrapper.findAllComponents("a").length).toBe(0);
        expect(wrapper.findAllComponents(".error-job-id").length).toBe(0);
    });

    it("renders error value if detail is not present", () => {
        const wrapper = shallowMount(ErrorAlert, {
            props: {
                error: {
                    error: "TEST ERROR TYPE",
                    detail: null
                }
            },
            store
        });

        expect(wrapper.findComponent(".error-message").text()).toBe("TEST ERROR TYPE");
    });

    it("shows job ID if present", () => {
        const wrapper = shallowMount(ErrorAlert, {
            props: jobIdProps,
            store
        });

        expect(wrapper.findComponent(".error-message").text()).toBe("Error text");
        expect(wrapper.findComponent("div").classes()).toStrictEqual(["pt-1", "text-danger"]);
        expect(wrapper.findComponent(".error-job-id").text()).toBe("Job ID: 12345abc");
        const jobId = wrapper.findComponent(".error-job-id").findComponent("span");
        expectTranslated(jobId, "Job ID", "ID du job",
            "ID de job", store as any);
    });
});
