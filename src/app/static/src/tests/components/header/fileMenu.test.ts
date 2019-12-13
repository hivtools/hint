import {mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import {
    mockAncResponse,
    mockBaselineState,
    mockError,
    mockFile,
    mockLoadState,
    mockMetadataState,
    mockModelRunState,
    mockPJNZResponse,
    mockPopulationResponse,
    mockProgramResponse,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import Modal from "../../../app/components/Modal.vue";
import {LoadingState} from "../../../app/store/load/load";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {Language} from "../../../app/store/translations/locales";

// jsdom has only implemented navigate up to hashes, hence appending a hash here to the base url
const mockCreateObjectUrl = jest.fn(() => "http://localhost#1234");
window.URL.createObjectURL = mockCreateObjectUrl;

describe("File menu", () => {

    const storeModules = {
        baseline: {
            namespaced: true,
            state: mockBaselineState({
                population: mockPopulationResponse({hash: "1csv", filename: "1.csv"}),
                pjnz: mockPJNZResponse({hash: "2csv", filename: "2.csv"}),
                shape: mockShapeResponse({hash: "3csv", filename: "3.csv"})
            })
        },
        surveyAndProgram: {
            namespaced: true,
            state: mockSurveyAndProgramState({
                survey: mockSurveyResponse({hash: "4csv", filename: "4.csv"}),
                program: mockProgramResponse({hash: "5csv", filename: "5.csv"}),
                anc: mockAncResponse({hash: "6csv", filename: "6.csv"})
            })
        },
        modelRun: {
            namespaced: true,
            state: mockModelRunState()
        },
        load: {
            namespaced: true,
            state: mockLoadState()
        },
        metadata: {
            namespaced: true,
            state: mockMetadataState()
        }
    };

    const createStore = (customModules = {}) => {
        const store = new Vuex.Store({
            state: {language: Language.en},
            modules: {
                ...storeModules,
                ...customModules
            }
        });
        registerTranslations(store);
        return store;
    };

    it("downloads file", (done) => {
        const wrapper = mount(FileMenu,
            {
                propsData: {title: "naomi"},
                store: createStore()
            });

        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        let link = wrapper.findAll(".dropdown-item").at(0);
        link.trigger("mousedown");
        expect(link.text()).toBe("Save");

        const hiddenLink = wrapper.find({ref: "save"});
        expect(hiddenLink.attributes("href")).toBe("http://localhost#1234");

        const re = new RegExp("naomi-(.*)\.json");
        expect((hiddenLink.attributes("download") as string).match(re)).toBeDefined();

        const expectedJson = JSON.stringify({
            state: {
                modelRun: mockModelRunState(),
                metadata: mockMetadataState()
            },
            files: {
                pjnz: {hash: "2csv", filename: "2.csv"},
                population: {hash: "1csv", filename: "1.csv"},
                shape: {hash: "3csv", filename: "3.csv"},
                survey: {hash: "4csv", filename: "4.csv"},
                programme: {hash: "5csv", filename: "5.csv"},
                anc: {hash: "6csv", filename: "6.csv"}
            }
        });

        const actualBlob = (mockCreateObjectUrl as jest.Mock).mock.calls[0][0];

        const reader = new FileReader();
        reader.addEventListener('loadend', function () {
            const text = reader.result as string;
            const result = JSON.parse(text)[1];
            expect(result).toEqual(expectedJson);
            done();
        });

        reader.readAsText(actualBlob);
    });

    it("opens file dialog on click load", (done) => {
        const wrapper = mount(FileMenu,
            {
                store: createStore()
            });

        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        const link = wrapper.findAll(".dropdown-item").at(1);
        expect(link.text()).toBe("Load");

        const input = wrapper.find("input").element as HTMLInputElement;
        input.addEventListener("click", function () {
            //file dialog was opened
            done();
        });

        link.trigger("mousedown");
    });

    it("invokes load action when file selected from dialog", () => {
        const mockLoadAction = jest.fn();

        const wrapper = mount(FileMenu,
            {
                store: createStore({
                    load: {
                        namespaced: true,
                        state: mockLoadState(),
                        actions: {
                            load: mockLoadAction
                        }
                    }
                })
            });

        const input = wrapper.find("input");

        const vm = wrapper.vm;
        const testFile = mockFile("test filename", "test file contents");
        //Can't programmatically construct a FileList to give to the real rendered input element, so we need to trick
        //the component with a mocked ref
        (vm.$refs as any).loadFile = {
            files: [testFile]
        };

        input.trigger("change");
        expect(mockLoadAction.mock.calls.length).toEqual(1);
        expect(mockLoadAction.mock.calls[0][1]).toBe(testFile)
    });

    it("does not open modal if no load error", () => {
        const wrapper = shallowMount(FileMenu,
            {
                store: createStore()
            });

        expect(wrapper.find(Modal).attributes("open")).toBeFalsy();
    });

    it("opens modal if load error", () => {
        const wrapper = shallowMount(FileMenu,
            {
                store: createStore({
                    load: {
                        namespaced: true,
                        state: mockLoadState({
                            loadingState: LoadingState.LoadFailed,
                            loadError: mockError("test error")
                        }),
                    }
                })
            });

        const modal = wrapper.find(Modal);
        expect(modal.attributes("open")).toEqual("true");
        expect(modal.find("h4").text()).toEqual("Load Error");
        expect(modal.find("p").text()).toEqual("test error");
    });


    it("modal can be dismissed", () => {
        const clearErrorMock = jest.fn();
        const wrapper = mount(FileMenu,
            {
                store: createStore({
                    load: {
                        namespaced: true,
                        state: mockLoadState({
                            loadingState: LoadingState.LoadFailed,
                            loadError: mockError("test error")
                        }),
                        actions: {
                            clearLoadState: clearErrorMock
                        }
                    }
                })
            });

        const modal = wrapper.find(Modal);
        modal.find(".btn").trigger("click");
        expect(modal.find(".btn").text()).toBe("OK");
        expect(clearErrorMock.mock.calls.length).toBe(1);
    });

});
