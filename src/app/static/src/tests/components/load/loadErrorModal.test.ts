import {mount} from "@vue/test-utils";
import LoadErrorModal from "../../../app/components/load/LoadErrorModal.vue"
import Vuex from "vuex";
import {RootState} from "../../../app/root";
import {initialStepperState} from "../../../app/store/stepper/stepper";
import {LoadingState} from "../../../app/store/load/state";
import {expectHasTranslationKey, expectTranslated} from "../../testHelpers";
import {mockError} from "../../mocks";

describe("loadErrorModal", () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    const mockClearLoadError = jest.fn();
    const mockRollbackInvalidState = jest.fn();
    const mockLoadVersion = jest.fn();
    const mockTranslate = jest.fn();

    const getWrapper = (hasError: boolean =  true, loadError: string = "Test Error Message", invalidSteps: number[] = []) => {
        const store = new Vuex.Store<RootState>({
            state: {
                invalidSteps
            } as any,
            actions: {
                rollbackInvalidState: mockRollbackInvalidState
            },
            modules: {
                load: {
                    namespaced: true,
                    state: {
                        loadingState: hasError ? LoadingState.LoadFailed : LoadingState.NotLoading,
                        loadError: {
                            detail: loadError
                        }
                    },
                    actions: {
                        clearLoadState: mockClearLoadError
                    }
                },
                projects: {
                    namespaced: true,
                    state: {
                        currentProject: {
                            id: "testProjectId"
                        },
                        currentVersion: {
                            id: "testVersionId"
                        }
                    },
                    actions: {
                        loadVersion: mockLoadVersion
                    }
                },
                stepper: {
                    namespaced: true,
                    state: initialStepperState()
                }
            }
        });

        return mount(LoadErrorModal, {
            store,
            directives: {
                translate: mockTranslate
            }
        })
    }

    it("can render error modal as expected when there is no load error", () => {
        const wrapper = getWrapper(false);
        const modal = wrapper.find(".modal")
        expect(modal.attributes()).toEqual({
            class: "modal",
            style: "display: none;"
        })
    });

   it("can render error modal as expected when there is load error and no invalid steps", () => {
        const wrapper = getWrapper();
        const modal = wrapper.find(".modal")
        expect(modal.attributes()).toEqual({
            class: "modal show",
            style: "display: block;",
        })
        expect(mockClearLoadError.mock.calls.length).toBe(0)
    });


   it("can display error text and translates elements when there is load error and no invalid steps", () => {
        const wrapper = getWrapper()
        const modal = wrapper.find(".modal")
        expect(mockClearLoadError.mock.calls.length).toBe(0)
        expect(modal.find("p").text()).toBe("Test Error Message")

        expect(mockTranslate.mock.calls.length).toBe(2)
        expect(mockTranslate.mock.calls[0][1].value).toBe("loadError")
        expect(mockTranslate.mock.calls[1][1].value).toBe("ok")

        expect(wrapper.find("#load-error-steps").exists()).toBe(false);
    });

    it("click OK can invoke clearLoadError modal", async () => {
        const wrapper = getWrapper()
        const okButton = wrapper.find(".modal button")
        expect(okButton.attributes()).toEqual(
            {
                "class": "btn btn-red",
                "data-dismiss": "modal",
                "id": "ok-load-error",
                "type": "button"
            })
        expectHasTranslationKey(okButton, "ok", "aria-label");
        expect(mockClearLoadError.mock.calls.length).toBe(0)
        await okButton.trigger("click")
        expect(mockClearLoadError.mock.calls.length).toBe(1)
    });

    it("can render error modal as expected where there are invalid steps after first step", () => {
        const wrapper = getWrapper(true, "test error", [2, 3]);
        expectHasTranslationKey(wrapper.find("span#load-error-steps"), "loadErrorSteps");
        const stepsListItems = wrapper.findAll("ul#load-error-steps-list li");
        expect(stepsListItems.length).toBe(2);
        expectHasTranslationKey(stepsListItems.at(0), "reviewInputs");
        expectHasTranslationKey(stepsListItems.at(1), "modelOptions");
        expectHasTranslationKey(wrapper.find("span#load-error-steps-from-valid-action"), "loadErrorStepsFromValidAction");
        expectHasTranslationKey(wrapper.find("span#load-error-last-valid"), "uploadInputs");
        expectHasTranslationKey(wrapper.find("span#load-error-steps-from-valid-info"), "loadErrorStepsFromValidInfo");
        expect(wrapper.find("#load-error-error").exists()).toBe(false);
        expect(wrapper.find("#load-error-steps-all-action").exists()).toBe(false);

        const retryBtn = wrapper.find("button#retry-load");
        expectHasTranslationKey(retryBtn, "retry");
        expectHasTranslationKey(retryBtn, "retry", "aria-label");
        const rollbackBtn = wrapper.find("button#rollback-load");
        expectHasTranslationKey(rollbackBtn, "rollback");
        expectHasTranslationKey(rollbackBtn, "rollback", "aria-label");
        expect(wrapper.find("button#ok-load-error").exists()).toBe(false);
    });

    it("can render error modal as expected where first step is invalid", () => {
        const wrapper = getWrapper(true, "test error", [1, 4]);
        expectHasTranslationKey(wrapper.find("span#load-error-steps"), "loadErrorSteps");
        const stepsListItems = wrapper.findAll("ul#load-error-steps-list li");
        expect(stepsListItems.length).toBe(2);
        expectHasTranslationKey(stepsListItems.at(0), "uploadInputs");
        expectHasTranslationKey(stepsListItems.at(1), "fitModel");
        expectHasTranslationKey(wrapper.find("#load-error-steps-all-action"), "loadErrorStepsAllAction");
        expect(wrapper.find("#load-error-error").exists()).toBe(false);
        expect(wrapper.find("#load-error-steps-from-valid-action").exists()).toBe(false)
        expect(wrapper.find("#load-error-last-valid").exists()).toBe(false);
        expect(wrapper.find("#load-error-steps-from-valid-info").exists()).toBe(false);

        expectHasTranslationKey(wrapper.find("button#retry-load"), "retry");
        expectHasTranslationKey(wrapper.find("button#rollback-load"), "rollback");
        expect(wrapper.find("button#ok-load-error").exists()).toBe(false);
    });

    it("click Retry invokes loadVersion action", async () => {
        const wrapper = getWrapper(true, "test error", [1]);
        await wrapper.find("button#retry-load").trigger("click");
        expect(mockLoadVersion.mock.calls[0][1]).toStrictEqual({versionId:  "testVersionId", projectId: "testProjectId"});
    });

    it("click Rollback invokes rollbackInvalidState action", async () => {
        const wrapper = getWrapper(true, "test error", [1]);
        await wrapper.find("button#rollback-load").trigger("click");
        expect(mockRollbackInvalidState).toHaveBeenCalledTimes(1);
    });
})