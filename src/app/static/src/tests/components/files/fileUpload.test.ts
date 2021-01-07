import Vue from "vue";
import {shallowMount, Slots} from '@vue/test-utils';

import FileUpload from "../../../app/components/files/FileUpload.vue";
import {mockFile} from "../../mocks";
import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {BDropdown} from "bootstrap-vue";
import {expectTranslated} from "../../testHelpers";

describe("File upload component", () => {

    const mockGetters = {
        editsRequireConfirmation: () => false,
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

    const createSut = (props?: any, slots?: Slots, store?: Store<RootState>) => {
        return shallowMount(FileUpload, {
            store: store || createStore(),
            propsData: {
                uploading: false,
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
        const store = createStore();
        const wrapper = createSut({
            name: "test-name"
        }, undefined, store);
        expectTranslated(wrapper.find(".custom-file-label"), "Select new file",
            "Sélectionner un nouveau fichier", store);
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

    it("emits uploading event while uploading", async () => {
        const wrapper = createSut();

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();

        await Vue.nextTick();

        expect(wrapper.emitted().uploading.length).toBe(1);
    });

    it("file input is disabled and label has uploading class when uploading is true", async () => {
        let wrapper = createSut();
        expect(wrapper.find("input").attributes("disabled")).toBeUndefined();
        expect(wrapper.find(".custom-file-label").classes()).not.toContain("uploading");

        wrapper = createSut({uploading: true});
        expect(wrapper.find("input").attributes("disabled")).toBe("disabled");
        expect(wrapper.find(".custom-file-label").classes()).toContain("uploading");
    });
});
