import Vuex from "vuex";
import {mount, Slots, Wrapper} from '@vue/test-utils';
import FileUpload from "../../../app/components/files/FileUpload.vue";
import ManageFile from "../../../app/components/files/ManageFile.vue";
import ResetConfirmation from "../../../app/components/ResetConfirmation.vue";
import {mockFile} from "../../mocks";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("File upload component", () => {

    const mockGetters = {
        editsRequireConfirmation: () => true,
        laterCompleteSteps: () => [{number: 4, textKey: "runModel"}]
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
        return mount(ManageFile, {
            store: createStore(),
            propsData: {
                error: null,
                label: "PJNZ",
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

    function deleteConfirmationModal(wrapper: Wrapper<FileUpload>) {
        return wrapper.findAll(ResetConfirmation).at(1)
    }

    it("opens confirmation modal when remove is clicked", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            existingFileName: "test.pjnz",
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
            existingFileName: "test.pjnz",
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
            existingFileName: "test.pjnz",
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        deleteConfirmationModal(wrapper).find(".btn-red").trigger("click");
        expect(removeHandler.mock.calls.length).toBe(0);
        expect(deleteConfirmationModal(wrapper).props("open")).toBe(false);
    });

});
