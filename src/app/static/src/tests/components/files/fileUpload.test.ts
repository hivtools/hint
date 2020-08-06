import Vue from "vue";
import {shallowMount, Slots} from '@vue/test-utils';

import FileUpload from "../../../app/components/files/FileUpload.vue";
import {mockFile} from "../../mocks";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {BDropdown} from "bootstrap-vue";

describe("File upload component", () => {

    const mockGetters = {
        editsRequireConfirmation: () => false,
        laterCompleteSteps: () => [{number: 4, text: "Run model"}]
    };

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                stepper: {
                    namespaced: true,
                    getters: mockGetters
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    const mockHideDropDown = jest.fn();
    const dropdownWithMockedHideMethod = Vue.extend({mixins: [BDropdown], methods: {hide: mockHideDropDown}});

    const createSut = (props?: any, slots?: Slots) => {
        return shallowMount(FileUpload, {
            store: createStore(),
            propsData: {
                upload: jest.fn(),
                name: "pjnz",
                accept: "csv",
                ...props
            },
            slots: slots,
            stubs: {
                "b-dropdown": dropdownWithMockedHideMethod
            }
        });
    };

    const testFile = mockFile("TEST FILE NAME", "TEST CONTENTS");

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("renders hidden input", () => {
        const wrapper = createSut({
            name: "test-name"
        });
        const input = wrapper.find("input");
        expect(input.attributes().accept).toBe("csv");
        expect(input.attributes().id).toBe("test-name");
        expect(wrapper.find({ref: "test-name"})).toStrictEqual(input);
    });

    it("renders label", () => {
        const wrapper = createSut({
            name: "test-name"
        });
        expect(wrapper.find(".custom-file-label").text()).toBe("Select new file");
    });

    it("calls upload when file is selected", async () => {

        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        const vm = wrapper.vm;
        (vm.$refs as any).pjnz = {
            files: [testFile]
        };

        wrapper.find("input").trigger("change");

        await Vue.nextTick();

        const formData = uploader.mock.calls[0][0] as FormData;
        expect(formData.get('file')).toBe(testFile);
    });

    it("calls upload function with formData", async () => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };

        (wrapper.vm as any).handleFileSelect();

        await Vue.nextTick();

        expect(uploader.mock.calls[0][0] instanceof FormData).toBe(true);
    });

    it("disables file select and emits uploading event while uploading", async () => {
        const wrapper = createSut();

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();

        await Vue.nextTick();

        expect(wrapper.find(".custom-file-label").attributes("disabled")).toBe("disabled");
        expect(wrapper.emitted().uploading.length).toBe(1);
    });
});
