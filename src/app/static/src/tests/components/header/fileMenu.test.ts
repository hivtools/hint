import {mount, shallowMount, VueWrapper} from "@vue/test-utils";
import Vuex, {Store} from "vuex";
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
    mockProgramResponse, mockProjectsState,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {LoadingState} from "../../../app/store/load/state";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {Language} from "../../../app/store/translations/locales";
import UploadNewProject from "../../../app/components/load/UploadNewProject.vue";
import {expectTranslated} from "../../testHelpers";
import {switches} from "../../../app/featureSwitches";

// jsdom has only implemented navigate up to hashes, hence appending a hash here to the base url
const mockCreateObjectUrl = jest.fn(() => "http://localhost#1234");
window.URL.createObjectURL = mockCreateObjectUrl;

describe("File menu", () => {

    const testProjects = [{id: 2, name: "proj1", versions: []}];
    const mockGetProjects = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks()
    })

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
        },
        projects: {
            namespaced: true,
            state: mockProjectsState({previousProjects: testProjects}),
            actions: {
                getProjects: mockGetProjects
            }
        }
    };

    const createStore = (customModules = {}, isGuest = true) => {
        const store = new Vuex.Store({
            state: {
                language: Language.en,
                updatingLanguage: false
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

    it("downloads JSON file", (done) => {
        switches.loadJson = true
        const store = createStore();
        const wrapper = mount(FileMenu,
            {
                props: {title: "naomi"},
                store
            });
        wrapper.findComponent(".dropdown-toggle").trigger("click");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        let link = wrapper.findAllComponents(".dropdown-item")[1];
        link.trigger("mousedown");
        expectTranslated(link, "SaveJSON", "SauvegarderJSON", "GuardarJSON", store as any);

        const hiddenLink = wrapper.findComponent({ref: "save"});
        expect(hiddenLink.attributes("href")).toBe("http://localhost#1234");

        const re = new RegExp("naomi-(.*)\.json");
        expect((hiddenLink.attributes("download") as string).match(re)).toBeDefined();

        const expectedJson = {
            state: {
                baseline: {selectedDataset: null, selectedRelease: null, selectedDatasetIsRefreshed: false},
                modelRun: mockModelRunState(),
                modelCalibrate: {result: null, calibratePlotResult: null, comparisonPlotResult: null},
                metadata: mockMetadataState(),
                surveyAndProgram: {selectedDataType: null, warnings: []},
                language: Language.en
            },
            files: {
                pjnz: {hash: "2csv", filename: "2.csv"},
                population: {hash: "1csv", filename: "1.csv"},
                shape: {hash: "3csv", filename: "3.csv"},
                survey: {hash: "4csv", filename: "4.csv"},
                programme: {hash: "5csv", filename: "5.csv"},
                anc: {hash: "6csv", filename: "6.csv"}
            }
        };

        const actualBlob = (mockCreateObjectUrl as jest.Mock).mock.calls[0][0];
        const reader = new FileReader();
        reader.addEventListener('loadend', function () {
            const text = reader.result as string;
            const result = JSON.parse(text)[1];
            expect(JSON.parse(result)).toStrictEqual(expectedJson);
            done();
        });

        reader.readAsText(actualBlob);
    });

    it("aria-label and link text are translated for Json load", () => {
        switches.loadJson = true
        const store = createStore();
        const wrapper = mount(FileMenu, {store});
        const link = wrapper.findAllComponents(".dropdown-item")[2];
        expectTranslated(link, "LoadJSON", "ChargerJSON", "CarregarJSON", store as any);
        const input = wrapper.findComponent("#upload-file")
        expectTranslated(input,
            "Select file",
            "Sélectionner un fichier",
            "Selecionar ficheiro",
            store as any,
            "aria-label");
    });

    it("aria-label and link text are translated for outputZip load", () => {
        const store = createStore();
        const wrapper = mount(FileMenu, {store});
        const link = wrapper.findAllComponents(".dropdown-item")[0];
        expectTranslated(link,
            "Load Model Outputs",
            "Charger les sorties du modèle",
            "Carregar Saídas do Modelo", store as any);
        const input = wrapper.findComponent("#upload-zip")
        expectTranslated(input,
            "Select file",
            "Sélectionner un fichier",
            "Selecionar ficheiro",
            store as any,
            "aria-label");
    });

    it("opens file dialog on click load JSON", (done) => {
        switches.loadJson = true
        const store = createStore();
        const wrapper = mount(FileMenu, {store});

        wrapper.findComponent(".dropdown-toggle").trigger("click");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        const link = wrapper.findAllComponents(".dropdown-item")[2];
        expectTranslated(link, "LoadJSON", "ChargerJSON", "CarregarJSON", store as any);

        const input = wrapper.findComponent("#upload-file").element as HTMLInputElement
        input.addEventListener("click", function () {
            //file dialog was opened
            done();
        });

        link.trigger("mousedown");
    });

    it("invokes load JSON action when file selected from dialog, when user is guest", () => {
        switches.loadJson = true
        const mockLoadAction = jest.fn();
        const clearLoadJsonInput = jest.fn()
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
                }),
                methods: { clearLoadJsonInput }
            });

        const testFile = mockFile("testFilename.json", "test file contents", "application/json");
        triggerSelectFile(wrapper, testFile, "#upload-file");
        expect(mockLoadAction.mock.calls.length).toEqual(1);
        expect(mockLoadAction.mock.calls[0][1]).toBe(testFile);
        expect((wrapper.findComponent("#project-json #load") as VueWrapper).props("open")).toBe(false);
        expect(clearLoadJsonInput).toHaveBeenCalledTimes(1)
    });

    it("does not invoke load JSON action when file selected from dialog, when user is guest", () => {
        switches.loadJson = true
        const mockLoadAction = jest.fn();
        const clearLoadJsonInput = jest.fn();
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
                }),
                methods: { clearLoadJsonInput }
            });

        wrapper.findComponent("#upload-file").trigger("change")
        expect(mockLoadAction.mock.calls.length).toEqual(0);
        expect((wrapper.findComponent("#load") as VueWrapper).props("open")).toBe(false);
        expect(clearLoadJsonInput).not.toHaveBeenCalled()
    });

    it("does not invoke preparingRehydrate action when file selected from dialog, when user is guest", () => {
        const mockPreparingRehydrate = jest.fn();
        const clearLoadZipInput = jest.fn();
        const wrapper = mount(FileMenu,
            {
                store: createStore({
                    load: {
                        namespaced: true,
                        state: mockLoadState(),
                        actions: {
                            preparingRehydrate: mockPreparingRehydrate
                        }
                    }
                }),
                methods: { clearLoadZipInput }
            });

        wrapper.findComponent("#upload-zip").trigger("change")
        expect(mockPreparingRehydrate.mock.calls.length).toEqual(0);
        expect((wrapper.findComponent("#load") as VueWrapper).props("open")).toBe(false);
        expect(clearLoadZipInput).not.toHaveBeenCalled()
    });

    it("invokes load model output action when file selected from dialog and user is guest", () => {
        const mockPreparingRehydrate = jest.fn()
        const clearLoadZipInput = jest.fn()
        const wrapper = mount(FileMenu,
            {
                store: createStore({
                    load: {
                        namespaced: true,
                        state: mockLoadState(),
                        actions: {
                            preparingRehydrate: mockPreparingRehydrate
                        }
                    }
                }),
                methods: { clearLoadZipInput }
            });

        const testFile = mockFile("test filename", "test file contents", "application/zip");
        triggerSelectFile(wrapper, testFile, "#upload-zip");
        expect(mockPreparingRehydrate.mock.calls.length).toBe(1);
        expect((wrapper.findComponent("#project-zip #load") as VueWrapper).props("open")).toBe(false);
        expect(clearLoadZipInput).toHaveBeenCalledTimes(1)
    });

    it("does not open error modal if no load error", () => {
        const wrapper = shallowMount(FileMenu,
            {
                store: createStore()
            });

        expect(wrapper.findComponent(UploadNewProject).attributes("open")).toBeFalsy();
    });

    it("error modal can be dismissed", () => {
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

        const projectModal = wrapper.findComponent(UploadNewProject);

        const modal = projectModal.findAllComponents(".modal")

        modal[1].findComponent(".btn").trigger("click");
        expectTranslated(modal[1].findComponent(".btn"), "OK", "OK", "OK", store as any);
        expect(clearErrorMock.mock.calls.length).toBe(1);
    });

    it("can open upload project modal when load JSON is triggered as non-guest", () => {
        switches.loadJson = true
        const mockLoadAction = jest.fn()
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState(),
                actions: {
                    load: mockLoadAction
                }
            }
        });
        const projectModal = openUploadNewProject(store, "#upload-file")
        expect(projectModal.props().openModal).toBe(false)
        projectModal.findComponent(".btn").trigger("click");
        expect(mockLoadAction.mock.calls.length).toBe(1);
        expect(projectModal.props().openModal).toBe(false)
    });

    it("can get projects when user is logged in when file is uploaded", () => {
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState()
            }
        }, false);
        const projectModal = openUploadNewProject(store, "#upload-zip", "application/zip")
        projectModal.findComponent(".btn").trigger("click");
        expect(mockGetProjects).toHaveBeenCalled()
    });

    it("can open upload project modal and does not get projects as guest when file is uploaded", () => {
        const mockPreparingRehydrate = jest.fn()
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState(),
                actions: {
                    preparingRehydrate: mockPreparingRehydrate
                }
            }
        });
        const projectModal = openUploadNewProject(store, "#upload-zip", "application/zip")
        projectModal.findComponent(".btn").trigger("click");
        expect(mockGetProjects).not.toHaveBeenCalled()
        expect(mockPreparingRehydrate.mock.calls.length).toBe(1);
        expect(projectModal.props().openModal).toBe(false)
    });

    it("triggers preparingRehydrate action as non-guest when file is uploaded", () => {
        const mockPreparingRehydrate = jest.fn()
        const mockProjectName = jest.fn()
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState(),
                actions: {
                    preparingRehydrate: mockPreparingRehydrate
                },
                mutations: {
                    SetProjectName: mockProjectName
                }
            }
        }, false);

        const wrapper = mount(FileMenu, {store});
        const testFile = mockFile("test.zip", "test file contents", "application/zip");
        triggerSelectFile(wrapper, testFile, "#upload-zip");
        const projectZip = wrapper.findComponent("#project-zip")
        expect((projectZip.findComponent("#load") as VueWrapper).props("open")).toBe(true);

        const confirmLoad = projectZip.findComponent("#confirm-load-project")
        projectZip.findComponent("#project-name-input").setValue("new uploaded project")
        confirmLoad.trigger("click")

        expect(mockProjectName.mock.calls.length).toBe(1);
        expect(mockProjectName.mock.calls[0][1]).toBe("new uploaded project");
        expect((wrapper.vm as any).fileToLoad).toBe(testFile);
        expect(mockPreparingRehydrate.mock.calls.length).toBe(1);
        expect(projectZip.findComponent(UploadNewProject).props().openModal).toBe(false);
    });

    it("triggers load action as non-guest when JSON file is uploaded", () => {
        switches.loadJson = true
        const mockLoadAction = jest.fn()
        const mockProjectName = jest.fn()
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState(),
                actions: {
                    load: mockLoadAction
                },
                mutations: {
                    SetProjectName: mockProjectName
                }
            }
        }, false);

        const wrapper = mount(FileMenu, {store});
        const testFile = mockFile("test.json", "test file contents", "application/json");
        triggerSelectFile(wrapper, testFile, "#upload-file");
        const jsonProject = wrapper.findComponent("#project-json");
        expect((jsonProject.findComponent("#load") as VueWrapper).props("open")).toBe(true);
        const confirmLoad = jsonProject.findComponent("#confirm-load-project")
        jsonProject.findComponent("#project-name-input").setValue("new uploaded project")
        confirmLoad.trigger("click")

        expect(mockProjectName.mock.calls.length).toBe(1);
        expect(mockProjectName.mock.calls[0][1]).toBe("new uploaded project");
        expect((wrapper.vm as any).fileToLoad).toBe(testFile);
        expect(mockLoadAction.mock.calls.length).toBe(1);
        expect(jsonProject.findComponent(UploadNewProject).props().openModal).toBe(false);
    });

    it("can render project upload zip props", async() => {
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState()
            }
        });

        const wrapper = mount(FileMenu, {store});

        const projectModal = wrapper.findComponent(UploadNewProject);

        expect(projectModal.exists()).toBeTruthy()
        expect(projectModal.props("cancelLoad")).toBeInstanceOf(Function)
        expect(projectModal.props("submitLoad")).toBeInstanceOf(Function)
        expect(projectModal.props("openModal")).toBe(false)
    });

    it("upload JSON shows project name modal when file selected from dialog, when user is not guest", () => {
        switches.loadJson = true
        const wrapper = mount(FileMenu, {store: createStore({}, false)});
        const testFile = mockFile("filename.json", "test file contents", "application/json");
        triggerSelectFile(wrapper, testFile, "#upload-file");

        expect((wrapper.findComponent("#project-json #load") as VueWrapper).props("open")).toBe(true);
        expect((wrapper.vm as any).fileToLoad).toBe(testFile);
    });

    it("upload rehydrate model shows project name modal when file selected from dialog, when user is not guest", () => {
        const wrapper = mount(FileMenu, {store: createStore({}, false)});
        const testFile = mockFile("test filename", "test file contents", "application/zip");
        triggerSelectFile(wrapper, testFile, "#upload-zip");
        expect((wrapper.findComponent("#project-zip #load") as VueWrapper).props("open")).toBe(true);
        expect((wrapper.vm as any).fileToLoad).toBe(testFile);
    });

    it("clicking cancel from Json project name modal hides modal", () => {
        const clearLoadJsonInput = jest.fn()
        const wrapper = mount(FileMenu,
            {
                data: () => {
                    return {projectNameJson: true}
                },
                store: createStore({}, false),
                methods: { clearLoadJsonInput }
            });

        const modal = wrapper.findComponent("#project-json #load");
        expect((modal as VueWrapper).props("open")).toBe(true);
        modal.findComponent("#cancel-load-project").trigger("click");
        expect((modal as VueWrapper).props("open")).toBe(false);
        expect(clearLoadJsonInput).toHaveBeenCalledTimes(1)
    });

    it("clicking cancel from Zip project name modal hides modal", () => {
        const clearLoadZipInput = jest.fn()
        const wrapper = mount(FileMenu,
            {
                data: () => {
                    return {projectNameZip: true}
                },
                store: createStore({}, false),
                methods: { clearLoadZipInput }
            });

        const modal = wrapper.findComponent("#project-zip #load");
        expect((modal as VueWrapper).props("open")).toBe(true);
        modal.findComponent("#cancel-load-project").trigger("click");
        expect((modal as VueWrapper).props("open")).toBe(false);
        expect(clearLoadZipInput).toHaveBeenCalledTimes(1)
    });

    it("should disable button when uploadZip input field is empty for new project upload", () => {
        const mockPreparingRehydrate = jest.fn()
        const mockProjectName = jest.fn()
        const store = createStore({
            load: {
                namespaced: true,
                state: mockLoadState(),
                actions: {
                    preparingRehydrate: mockPreparingRehydrate
                },
                mutations: {
                    SetProjectName: mockProjectName
                }
            }
        }, false);

        const wrapper = mount(FileMenu, {store});
        const testFile = mockFile("test.zip", "test file contents", "application/zip");
        triggerSelectFile(wrapper, testFile, "#upload-zip");
        const projectZip = wrapper.findComponent("#project-zip")
        const confirmLoad = projectZip.findComponent("#confirm-load-project")
        expect(confirmLoad.attributes("disabled")).toBe("disabled")
        projectZip.findComponent("#project-name-input").setValue("new uploaded project")
        expect(confirmLoad.attributes("disabled")).toBeUndefined()
    });

    it("does not render load and save Json project", () => {
        switches.loadJson = false
        const store = createStore();
        const wrapper = mount(FileMenu, {store});
        const link = wrapper.findAllComponents(".dropdown-item");

        expect(link.length).toBe(1)
        expect(link[0].text()).toBe("Load Model Outputs")
    });
});

const openUploadNewProject = (store: Store<any>, inputId= "#upload-file", fileType = "application/json") => {
    const wrapper = mount(FileMenu, {store});
    const testFile = mockFile("test filename", "test file contents", fileType);
    triggerSelectFile(wrapper, testFile, inputId);
    const projectModal = wrapper.findComponent(UploadNewProject);
    expect(projectModal.exists()).toBeTruthy()
    return projectModal
}

const triggerSelectFile = (wrapper: VueWrapper, testFile: File, id: string) => {
    const vm = wrapper.vm;
    const input = wrapper.findComponent(id);

    //Can't programmatically construct a FileList to give to the real rendered input element, so we need to trick
    //the component with a mocked ref
    if (testFile.type == "application/zip") {
        (vm.$refs as any).loadZip = {
            files: [testFile]
        };
    } else if (testFile.type == "application/json") {
        (vm.$refs as any).loadJson = {
            files: [testFile]
        };
    }

    input.trigger("change");
};