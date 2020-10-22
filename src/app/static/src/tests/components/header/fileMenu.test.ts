import {mount, shallowMount, Wrapper} from "@vue/test-utils";
import Vue from "vue";
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
import {expectTranslated} from "../../testHelpers";
import {emptyState} from "../../../app/root";

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

    const createStore = (customModules = {}, isGuest = true) => {
        const store = new Vuex.Store({
            state: {
                language: Language.en
            },
            getters: {
                isGuest: () => isGuest
            },
            modules: {
                ...storeModules,
                ...customModules
            }
        });
        registerTranslations(store);
        return store;
    };

    const triggerSelectFile = (wrapper: Wrapper<FileMenu>, testFile: File) => {
        const vm = wrapper.vm;
        const input = wrapper.find("input");

        //Can't programmatically construct a FileList to give to the real rendered input element, so we need to trick
        //the component with a mocked ref
        (vm.$refs as any).loadFile = {
            files: [testFile]
        };

        input.trigger("change");
    };

    it("downloads file", (done) => {
        const store = createStore();
        const wrapper = mount(FileMenu,
            {
                propsData: {title: "naomi"},
                store
            });

        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        let link = wrapper.findAll(".dropdown-item").at(0);
        link.trigger("mousedown");
        expectTranslated(link, "Save", "Sauvegarder", store as any);

        const hiddenLink = wrapper.find({ref: "save"});
        expect(hiddenLink.attributes("href")).toBe("http://localhost#1234");

        const re = new RegExp("naomi-(.*)\.json");
        expect((hiddenLink.attributes("download") as string).match(re)).toBeDefined();

        const expectedJson = JSON.stringify({
            state: {
                baseline: {selectedDataset: null},
                modelRun: mockModelRunState(),
                metadata: mockMetadataState(),
                surveyAndProgram: {selectedDataType: null}
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
        const store = createStore();
        const wrapper = mount(FileMenu, {store});

        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        const link = wrapper.findAll(".dropdown-item").at(1);
        expectTranslated(link, "Load", "Charger", store as any);

        const input = wrapper.find("input").element as HTMLInputElement;
        input.addEventListener("click", function () {
            //file dialog was opened
            done();
        });

        link.trigger("mousedown");
    });

    it("invokes load action when file selected from dialog, when user is guest", () => {
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

        const testFile = mockFile("test filename", "test file contents");
        triggerSelectFile(wrapper, testFile);
        expect(mockLoadAction.mock.calls.length).toEqual(1);
        expect(mockLoadAction.mock.calls[0][1].file).toBe(testFile);
        expect(mockLoadAction.mock.calls[0][1].projectName).toBeNull();
        expect(wrapper.find("#load-project-name").props("open")).toBe(false);
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
        const store = createStore({
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
        });

        const wrapper = mount(FileMenu, {store});

        const modal = wrapper.find(Modal);
        modal.find(".btn").trigger("click");
        expectTranslated(modal.find(".btn"), "OK", "OK", store as any);
        expect(clearErrorMock.mock.calls.length).toBe(1);
    });

    it("shows project name modal when file selected from dialog, when user is not guest", () => {
        const wrapper = mount(FileMenu, {store: createStore({}, false)});
        const testFile = mockFile("test filename", "test file contents");
        triggerSelectFile(wrapper, testFile);

        expect(wrapper.find("#load-project-name").props("open")).toBe(true);
        expect((wrapper.vm as any).fileToLoad).toBe(testFile);
    });

    it("clicking confirm load to project button invokes load action", async () => {
        const mockLoadAction = jest.fn();
        const testFile = mockFile("test filename", "test file contents");

        const wrapper = mount(FileMenu,
            {
                data: () => {
                    return {requestProjectName: true, fileToLoad: testFile}
                },
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

        wrapper.find("#project-name-input").setValue("new project");
        wrapper.find("#confirm-load-project").trigger("click");
        await Vue.nextTick();
        expect(mockLoadAction.mock.calls.length).toEqual(1);
        expect(mockLoadAction.mock.calls[0][1].file).toBe(testFile);
        expect(mockLoadAction.mock.calls[0][1].projectName).toBe("new project");
        expect(wrapper.find("#load-project-name").props("open")).toBe(false);
    });

    it("clicking cancel from project name modal hides modal", () => {
        const wrapper = mount(FileMenu,
            {
                data: () => {
                    return {requestProjectName: true}
                },
                store: createStore({}, false)
            });

        const modal = wrapper.find("#load-project-name");
        expect(modal.props("open")).toBe(true);
        modal.find("#cancel-load-project").trigger("click");
        expect(modal.props("open")).toBe(false);
    });

    it("confirm load to project button is disabled when project name is empty", () => {
        const wrapper = mount(FileMenu,
            {
                data: () => {
                    return {requestProjectName: true}
                },
                store: createStore({}, false)
            });

        const confirmButton = wrapper.find("#confirm-load-project");
        expect(confirmButton.attributes("disabled")).toBe("disabled");

        wrapper.find("#project-name-input").setValue("test");
        expect(confirmButton.attributes("disabled")).toBeUndefined();
    });
});
