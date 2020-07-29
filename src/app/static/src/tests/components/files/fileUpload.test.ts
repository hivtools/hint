import Vue from "vue";
import {shallowMount, Slots} from '@vue/test-utils';

import FileUpload from "../../../app/components/files/FileUpload.vue";
import {mockFile} from "../../mocks";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

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

    const createSut = (props?: any, slots?: Slots) => {
        return shallowMount(FileUpload, {
            store: createStore(),
            propsData: {
                upload: jest.fn(),
                name: "pjnz",
                accept: "csv",
                ...props
            },
            slots: slots
        });
    };

    const testFile = mockFile("TEST FILE NAME", "TEST CONTENTS");

    it("renders hidden input", () => {
        const wrapper = createSut({
            name: "test-name"
        });
        const input = wrapper.find("input");
        expect(input.attributes().accept).toBe("csv");
        expect(input.attributes().id).toBe("test-name");
        expect(wrapper.find({ref: "test-name"})).toStrictEqual(input);
    });

    it("calls upload when file is selected", (done) => {

        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        const vm = wrapper.vm;
        (vm.$refs as any).pjnz = {
            files: [testFile]
        };

        wrapper.find("input").trigger("change");

        setTimeout(() => {
            const formData = uploader.mock.calls[0][0] as FormData;
            expect(formData.get('file')).toBe(testFile);
            done();
        });

    });

    it("calls upload function with formData", (done) => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };

        (wrapper.vm as any).handleFileSelect();

        setTimeout(() => {
            expect(uploader.mock.calls[0][0] instanceof FormData).toBe(true);
            done();
        });
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
});
