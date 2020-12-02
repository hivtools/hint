import Vuex from "vuex";
import {mount, Slots, Wrapper} from '@vue/test-utils';
import FileUpload from "../../../app/components/files/FileUpload.vue";
import ManageFile from "../../../app/components/files/ManageFile.vue";
import ResetConfirmation from "../../../app/components/ResetConfirmation.vue";
import {mockFile, mockRootState} from "../../mocks";
import {emptyState, RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {getters} from "../../../app/store/root/getters";

declare let currentUser: string;
currentUser = "guest";

describe("File upload component", () => {

    const mockGetters = {
        editsRequireConfirmation: () => true,
        laterCompleteSteps: () => [{number: 4, textKey: "fitModel"}]
    };

    const createStore = (partialRootState: Partial<RootState> = {}) => {
        const store = new Vuex.Store({
            state: mockRootState(partialRootState),
            getters: getters,
            modules: {
                stepper: {
                    namespaced: true,
                    getters: mockGetters
                },
                projects: {
                    namespaced: true
                },
                errors: {
                    namespaced: true
                },
            }
        });
        registerTranslations(store);
        return store;
    };

    const createSut = (props?: any, slots?: Slots, partialRootState: Partial<RootState> = {}) => {
        return mount(ManageFile, {
            store: createStore(partialRootState),
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
        }, {
            currentUser: 'guest'
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        deleteConfirmationModal(wrapper).find(".btn-red").trigger("click");
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
        deleteConfirmationModal(wrapper).find(".btn-white").trigger("click");
        expect(removeHandler.mock.calls.length).toBe(0);
        expect(deleteConfirmationModal(wrapper).props("open")).toBe(false);
    });

});
