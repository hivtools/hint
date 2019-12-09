import Vuex from "vuex";
import {mount, Slots, Wrapper} from '@vue/test-utils';
import FileUpload from "../../app/components/FileUpload.vue";
import ResetConfirmation from "../../app/components/ResetConfirmation.vue";
import {mockFile} from "../mocks";

describe("File upload component", () => {

    const mockGetters = {
        editsRequireConfirmation: () => true,
        laterCompleteSteps: () => [{number: 4, text: "Run model"}]
    };

    const createStore = () => new Vuex.Store({
        modules: {
            stepper: {
                namespaced: true,
                getters: mockGetters
            }
        }
    });

    const createSut = (props?: any, slots?: Slots) => {
        return mount(FileUpload, {
            store: createStore(),
            propsData: {
                error: null,
                label: "",
                valid: true,
                upload: jest.fn(),
                deleteFile: jest.fn(),
                name: "pjnz",
                accept: "csv",
                ...props
            },
            slots: slots
        });
    };

    const testFile = mockFile("TEST FILE NAME", "TEST CONTENTS");

    function uploadConfirmationModal(wrapper: Wrapper<FileUpload>) {
        return wrapper.findAll(ResetConfirmation).at(0)
    }

    function deleteConfirmationModal(wrapper: Wrapper<FileUpload>) {
        return wrapper.findAll(ResetConfirmation).at(1)
    }

    it("opens confirmation modal when remove is clicked", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        expect(deleteConfirmationModal(wrapper).props("open")).toBe(true);
    });

    it("deletes file if user confirms edit", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        deleteConfirmationModal(wrapper).find(".btn-white").trigger("click");
        expect(removeHandler.mock.calls.length).toBe(1);
        expect(deleteConfirmationModal(wrapper).props("open")).toBe(false);
    });

    it("does not delete file if user cancels edit", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        deleteConfirmationModal(wrapper).find(".btn-red").trigger("click");
        expect(removeHandler.mock.calls.length).toBe(0);
        expect(deleteConfirmationModal(wrapper).props("open")).toBe(false);
    });

    it("opens confirmation modal when new file is selected", () => {
        const wrapper = createSut();
        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();
        expect(uploadConfirmationModal(wrapper).props("open")).toBe(true);
    });

    it("uploads file if user confirms edit", (done) => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };

        (wrapper.vm as any).handleFileSelect();
        uploadConfirmationModal(wrapper).find(".btn-white").trigger("click");

        setTimeout(() => {
            expect(uploader.mock.calls.length).toBe(1);
            expect(uploadConfirmationModal(wrapper).props("open")).toBe(false);
            done();
        });
    });

    it("does not upload file if user cancels edit", (done) => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };

        (wrapper.vm as any).handleFileSelect();
        uploadConfirmationModal(wrapper).find(".btn-red").trigger("click");

        setTimeout(() => {
            expect(uploader.mock.calls.length).toBe(0);
            expect(uploadConfirmationModal(wrapper).props("open")).toBe(false);
            done();
        });
    });

});
