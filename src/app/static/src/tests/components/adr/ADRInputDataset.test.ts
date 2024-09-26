import Vuex, {ActionTree, Store} from "vuex";
import {nextTick} from "vue";
import {flushPromises} from "@vue/test-utils";
import ADRInputDataset from "../../../app/components/adr/ADRInputDataset.vue";
import SelectRelease from "../../../app/components/adr/SelectRelease.vue";
import TreeSelect from "@reside-ic/vue3-treeselect"
import {
    mockADRDatasetState,
    mockADRDataState,
    mockBaselineState,
    mockDataset,
    mockDatasetResource,
    mockErrorsState,
    mockPJNZResponse,
    mockPopulationResponse,
    mockProjectsState,
    mockRootState,
    mockShapeResponse
} from "../../mocks";
import {BaselineState} from "../../../app/store/baseline/baseline";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {BaselineMutation} from "../../../app/store/baseline/mutations";
import {ADRMutation} from "../../../app/store/adr/mutations";
import {BaselineActions} from "../../../app/store/baseline/actions";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {ADRSchemas} from "../../../app/types";
import VueFeather from "vue-feather";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslatedWithStoreType, mountWithTranslate, shallowMountWithTranslate} from "../../testHelpers";
import {AdrDatasetType, ADRState} from "../../../app/store/adr/adr";
import ResetConfirmation from "../../../app/components/resetConfirmation/ResetConfirmation.vue";
import HintTreeSelect from "../../../app/components/HintTreeSelect.vue";
import {getters} from "../../../app/store/root/getters";
import {Mock} from "vitest";
import SelectDatasetModal from "../../../app/components/adr/SelectDatasetModal.vue";
import {RootState} from "../../../app/root";

describe("ADR input dataset", () => {

    const schemas: ADRSchemas = {
        baseUrl: "www.adr.com/",
        anc: "anc",
        programme: "prog",
        pjnz: "pjnz",
        population: "pop",
        shape: "shape",
        survey: "survey",
        vmmc: "vmmc",
        outputZip: "zip",
        outputSummary: "summary",
        outputComparison: "comparison"
    }

    const pjnz = {
        id: "1",
        resource_type: schemas.pjnz,
        url: "pjnz.pjnz",
        last_modified: "2020-11-01",
        metadata_modified: "2020-11-02",
        name: "PJNZ resource"
    }
    const shape = {
        id: "2",
        resource_type: schemas.shape,
        url: "shape.geojson",
        last_modified: "2020-11-03",
        metadata_modified: "2020-11-04",
        name: "Shape Resource"
    }
    const pop = {
        id: "3",
        resource_type: schemas.population,
        url: "pop.csv",
        last_modified: "2020-11-05",
        metadata_modified: "2020-11-06",
        name: "Population Resource"
    }
    const survey = {
        id: "4",
        resource_type: schemas.survey,
        url: "survey.csv",
        last_modified: "2020-11-07",
        metadata_modified: "2020-11-08",
        name: "Survey Resource"
    }
    const program = {
        id: "5",
        resource_type: schemas.programme,
        url: "program.csv",
        last_modified: "2020-11-07",
        metadata_modified: "2020-11-08",
        name: "Program Resource"
    }
    const anc = {
        id: "6",
        resource_type: schemas.anc,
        url: "anc.csv",
        last_modified: "2020-11-09",
        metadata_modified: "2020-11-10",
        name: "ANC Resource"
    }
    const vmmc = {
        id: "7",
        resource_type: schemas.vmmc,
        url: "vmmc.xlsx",
        last_modified: "2020-11-09",
        metadata_modified: "2020-11-10",
        name: "VMMC Resource"
    }

    const fakeRawDatasets = [
        {
            id: "id1",
            title: "Some data",
            organization: {title: "org", id: "org-id"},
            name: "some-data",
            type: "naomi-data",
            resources: []
        },
        {
            id: "id2",
            title: "Some data 2",
            organization: {title: "org", id: "org-id"},
            name: "some-data",
            type: "naomi-data",
            resources: []
        }
    ]

    const fakeDataset = {
        id: "id1",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null,
            vmmc: null
        }
    };

    const fakeDataset2 = {
        id: "id2",
        title: "Some data 2",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                id: "2",
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null,
            vmmc: null
        }
    };

    const fakeDatasetWithRelease = {
        id: "id1",
        title: "Some data",
        url: "https://adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        release: "release1",
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null,
            vmmc: null
        }
    };

    const fakeRelease = {
        id: "1.0",
        name: "release1",
        notes: "some notes",
        activity_id: "activityId",
    }

    const setDatasetMock = vi.fn();
    const setReleaseMock = vi.fn();
    const markResourcesUpdatedMock = vi.fn();
    const getDatasetsMock = vi.fn();
    const getReleasesMock = vi.fn();
    const getDatasetMock = vi.fn();

    const baselineActions: Partial<BaselineActions> & ActionTree<any, any> = {
        importShape: vi.fn(),
        importPopulation: vi.fn(),
        importPJNZ: vi.fn(),
        refreshDatasetMetadata: vi.fn(),
        deleteAll: vi.fn()
    }

    const surveyProgramActions: Partial<SurveyAndProgramActions> & ActionTree<any, any> = {
        importSurvey: vi.fn(),
        importProgram: vi.fn(),
        importANC: vi.fn(),
        importVmmc: vi.fn(),
    }

    const mockGetters = {
        editsRequireConfirmation: () => false,
        changesToRelevantSteps: () => [{ number: 4, textKey: "fitModel" }]
    };

    let currentVersion = {id: "version-id", created: "", updated: "", versionNumber: 1}

    const genericModules = (baselineProps: Partial<BaselineState> = {}, adrProps: Partial<ADRState> = {}, requireConfirmation: boolean, baselineGetters = {}) => {
        return {
            adr: {
                namespaced: true,
                state: {
                    schemas: schemas,
                    adrData: mockADRDataState({
                        [AdrDatasetType.Input]: mockADRDatasetState({
                            datasets: fakeRawDatasets,
                            releases: [],
                        })
                    }),
                    ...adrProps
                },
                actions: {
                    getDatasets: getDatasetsMock,
                    getReleases: getReleasesMock,
                    getDataset: getDatasetMock
                },
                mutations: {
                    [ADRMutation.ClearReleases]: vi.fn(),
                    [ADRMutation.SetReleases]: vi.fn()
                }
            },
            baseline: {
                namespaced: true,
                state: mockBaselineState({selectedDataset: null, selectedRelease: null, ...baselineProps}),
                actions: baselineActions,
                mutations: {
                    [BaselineMutation.SetDataset]: setDatasetMock,
                    [BaselineMutation.SetRelease]: setReleaseMock,
                    [BaselineMutation.MarkDatasetResourcesUpdated]: markResourcesUpdatedMock
                },
                getters: {
                    selectedDatasetAvailableResources: () => fakeDataset.resources,
                    ...baselineGetters
                }
            },
            stepper: {
                namespaced: true,
                getters: {...mockGetters, editsRequireConfirmation: () => requireConfirmation}
            },
            errors: {
                namespaced: true,
                state: mockErrorsState(),
            },
            surveyAndProgram: {
                namespaced: true,
                actions: surveyProgramActions
            }
        }
    }

    const getRootStore = (baselineProps: Partial<BaselineState> = {},
        adrProps: Partial<ADRState> = {},
        requireConfirmation: boolean = false,
        baselineGetters = {}) => {

        const store = new Vuex.Store({
            state: mockRootState(),
            getters: getters,
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState({currentProject: {id: 1, name: "v1", versions: []}, currentVersion}),
                    actions: {
                        newVersion: vi.fn()
                    }
                },
                ...genericModules(baselineProps, adrProps, requireConfirmation, baselineGetters)
            }
        });
        registerTranslations(store);
        return store;
    }

    const getStore = (baselineProps: Partial<BaselineState> = {},
        adrProps: Partial<ADRState> = {},
        requireConfirmation: boolean = false,
        baselineGetters = {}) => {

        const store = new Vuex.Store({
            state: mockRootState(),
            getters: getters,
            modules: genericModules(baselineProps, adrProps, requireConfirmation, baselineGetters)
        });
        registerTranslations(store);
        return store;
    }

    const mountADRDataset = (store: Store<RootState>, globalOptions = {}) => {
        return mountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store],
                ...globalOptions
            },
            propsData: {
                datasetType: AdrDatasetType.Input
            },
        });
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it("refreshes selected dataset metadata on mount and sets interval to poll refresh", () => {
        const store = getStore();
        const rendered = mountADRDataset(store);
        expect((rendered.vm as any).pollingId).not.toBeNull();
        expect((baselineActions.refreshDatasetMetadata as Mock).mock.calls.length).toBe(1);
        vi.advanceTimersByTime(10000);
        expect((baselineActions.refreshDatasetMetadata as Mock).mock.calls.length).toBe(2);
    });

    it("renders select dataset button when no dataset is selected", async () => {
        let store = getStore()
        const rendered = mountADRDataset(store);
        await expectTranslatedWithStoreType(rendered.find("button"), "Select ADR dataset",
            "Sélectionner l’ensemble de données ADR", "Selecionar conjunto de dados do ADR", store);
    });

    it("renders edit dataset button when dataset is already selected", async () => {
        let store = getStore({
            selectedDataset: fakeDataset
        })
        const rendered = mountADRDataset(store);
        await expectTranslatedWithStoreType(rendered.find("button"), "Edit", "Éditer", "Editar", store);
    });

    it("does not render refresh button or info icon when no resources are out of date", () => {
        const store = getStore({ selectedDataset: fakeDataset })
        const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.findAll("button").length).toBe(1);
        expect(rendered.findAllComponents(VueFeather).length).toBe(0);
    });

    it("shows refresh button and info icon if any resource is out of date", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true});
        const store = getStore({selectedDataset: fakeDataset});
        const mockTooltipDirective = vi.fn();
        const rendered = mountADRDataset(store, {
            directives: {"tooltip": mockTooltipDirective},
            stubs: ["treeselect"],
        });
        const buttons = rendered.findAll("button");
        await expectTranslatedWithStoreType(buttons[0], "Refresh", "Rafraîchir", "Atualizar", store);
        await expectTranslatedWithStoreType(buttons[1], "Edit", "Éditer", "Editar", store);

        const infoIcons = rendered.findAllComponents(VueFeather);
        expect(infoIcons.length).toBe(1);
        expect(infoIcons[0].props("type")).toBe("info");

        expect(mockTooltipDirective.mock.calls[0][0].innerHTML)
            .toContain("<circle cx=\"12\" cy=\"12\" r=\"10\"></circle>"); // tooltip should be on the icon
        expect(mockTooltipDirective.mock.calls[0][1].value)
            .toBe("The following files have been updated in the ADR: PJNZ. Use the refresh button to import the latest files.");
    });

    it("refreshes out of date baseline files", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"});
        fakeDataset.resources.pop = mockDatasetResource({outOfDate: true, url: "pop.url"});
        fakeDataset.resources.shape = mockDatasetResource({outOfDate: true, url: "shape.url"});

        const store = getStore({selectedDataset: fakeDataset});
        const rendered = mountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            }, sync: false
        });
        await rendered.findAll("button")[0].trigger("click");
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(true);
        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);
        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.url");
        expect((baselineActions.importPopulation as Mock).mock.calls[0][1]).toBe("pop.url");
        expect((baselineActions.importShape as Mock).mock.calls[0][1]).toBe("shape.url");
    });

    it("marks resources as updated after refreshing", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"})
        const store = getStore({selectedDataset: fakeDataset});
        const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            }, sync: false
        });
        await rendered.findAll("button")[0].trigger("click");

        expect(markResourcesUpdatedMock.mock.calls.length).toBe(1);
    });

    it("refresh stops and starts polling for dataset metadata changes", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"})
        const store = getStore({selectedDataset: fakeDataset});
        const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            }, sync: false
        });

        const oldPollingId = (rendered.vm as any).pollingId;
        const clearIntervalSpy = vi.spyOn(window, "clearInterval");
        const setIntervalSpy = vi.spyOn(window, "setInterval");

        await rendered.findAll("button")[0].trigger("click");

        expect(clearIntervalSpy.mock.calls[0][0]).toBe(oldPollingId);
        expect(setIntervalSpy.mock.calls[0][0]).toBe((rendered.vm as any).refreshDatasetMetadata);
        expect(setIntervalSpy.mock.calls[0][1]).toBe(10000);
        expect((rendered.vm as any).pollingId).not.toBe(oldPollingId);
    });

    it("renders modal and spinner while refreshing", async () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"})
        const store = getStore({selectedDataset: fakeDataset});
        const rendered = mountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            }, sync: false
        });
        await rendered.findAll("button")[0].trigger("click");

        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(true);
        expect(rendered.find("#loading-dataset").findAllComponents(LoadingSpinner).length).toBe(1);
        expect(rendered.find("#fetch-error").exists()).toBe(false);

        await flushPromises();

        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
        expect(rendered.find("#loading-dataset").exists()).toBe(false);
    });

    it("refreshes survey & program files if any baseline file is refreshed and pre-existing shape file present",
        async () => {
            const fakeDataset = mockDataset();
            fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"});
            fakeDataset.resources.survey = mockDatasetResource({url: "survey.url"});
            fakeDataset.resources.program = mockDatasetResource({url: "program.url"});
            fakeDataset.resources.anc = mockDatasetResource({url: "anc.url"});
            fakeDataset.resources.vmmc = mockDatasetResource({url: "vmmc.url"});
            const store = getStore({selectedDataset: fakeDataset, shape: mockShapeResponse()});
            const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
                global: {
                    plugins: [store]
                },
                propsData: {
                    datasetType: AdrDatasetType.Input
                },
                sync: false
            });
            await rendered.findAll("button")[0].trigger("click");
            expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.url");
            expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.url");
            expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.url");
            expect((surveyProgramActions.importVmmc as Mock).mock.calls[0][1]).toBe("vmmc.url");
        });

    it("refreshes survey & program files if any baseline file is refreshed and shape file included in resources",
        async () => {
            const fakeDataset = mockDataset();
            fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true, url: "pjnz.url"});
            fakeDataset.resources.survey = mockDatasetResource({url: "survey.url"});
            fakeDataset.resources.program = mockDatasetResource({url: "program.url"});
            fakeDataset.resources.anc = mockDatasetResource({url: "anc.url"});
            fakeDataset.resources.vmmc = mockDatasetResource({url: "vmmc.url"});
            fakeDataset.resources.shape = mockDatasetResource();
            const store = getStore({selectedDataset: fakeDataset});
            const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
                global: {
                    plugins: [store]
                }, sync: false
            });
            await rendered.findAll("button")[0].trigger("click");
            expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.url");
            expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.url");
            expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.url");
            expect((surveyProgramActions.importVmmc as Mock).mock.calls[0][1]).toBe("vmmc.url");
        });

    it("refreshes survey & program files if out of date",
        async () => {
            const fakeDataset = mockDataset();
            fakeDataset.resources.survey = mockDatasetResource({url: "survey.url", outOfDate: true});
            fakeDataset.resources.program = mockDatasetResource({url: "program.url", outOfDate: true});
            fakeDataset.resources.anc = mockDatasetResource({url: "anc.url", outOfDate: true});
            fakeDataset.resources.vmmc = mockDatasetResource({url: "vmmc.url", outOfDate: true});
            fakeDataset.resources.shape = mockDatasetResource();
            const store = getStore({ selectedDataset: fakeDataset });
            const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
                global: {
                    plugins: [store]
                }, sync: false
            });
            await rendered.findAll("button")[0].trigger("click");
            expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.url");
            expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.url");
            expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.url");
            expect((surveyProgramActions.importVmmc as Mock).mock.calls[0][1]).toBe("vmmc.url");
        });

    it("renders selected dataset if it exists", async () => {
        let store = getStore({
            selectedDataset: fakeDataset
        })
        const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            },
        });
        await expectTranslatedWithStoreType(rendered.find(".font-weight-bold"), "Selected dataset:",
            "Ensemble de données sélectionné :", "Conjunto de dados selecionado:", store);
        expect(rendered.find("a").text()).toBe("Some data");
        expect(rendered.find("a").attributes("href")).toBe("www.adr.com/naomi-data/some-data");
    });

    it("renders selected dataset and selected release with url pointing to release's activity page", async () => {
        let store = getStore({
            selectedDataset: fakeDatasetWithRelease,
            selectedRelease: fakeRelease
        })
        const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            },
        });
        await expectTranslatedWithStoreType(rendered.find(".font-weight-bold"), "Selected dataset:",
            "Ensemble de données sélectionné :", "Conjunto de dados selecionado:", store);

        expect(rendered.find("a").text()).toBe("Some data — release1");
        expect(rendered.find("a").attributes("href")).toBe("https://adr.com/dataset/id1?activity_id=activityId");
    });

    it("does not render selected dataset if it doesn't exist", () => {
        const store = getStore();
        const rendered = shallowMountWithTranslate(ADRInputDataset, store, {
            global: {
                plugins: [store]
            },
        });
        expect(rendered.findAll("#selectedDatasetSpan").length).toBe(0);
        expect(rendered.findAll("a").length).toBe(0);
    });

    it("can open and close select dataset", async () => {
        const store = getStore();
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"],
        });
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
        await rendered.find("button").trigger("click");
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(true);
        await rendered.findComponent(SelectDatasetModal).findAll("button")[1].trigger("click");
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
    });

    it("sets current dataset", async () => {
        let store = getStore({selectedDataset: fakeDataset2});
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        // open modal
        await rendered.find("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        expect(rendered.findComponent(SelectDatasetModal).findAll("button").length).toBe(2);
        expect(rendered.findAll("p").length).toBe(0);

        await expectTranslatedWithStoreType(rendered.find("h4"), "Browse ADR", "Parcourir ADR", "Procurar no ADR", store);
        await expectTranslatedWithStoreType(rendered.find("div > label"), "Datasets", "Ensembles de données",
            "Conjuntos de dados", store);

        // dataset is preselected in dropdown and click button to import
        expect(rendered.findComponent(TreeSelect).attributes()["model-value"]).toBe("id2");
        const selectRelease = rendered.findComponent(SelectRelease)
        await selectRelease.vm.$emit("selected-dataset-release", fakeRelease);
        await rendered.findComponent(SelectDatasetModal).find("button").trigger("click");

        expect(rendered.find("#loading-dataset").findComponent(LoadingSpinner).exists()).toBe(true);
        expect(rendered.findAllComponents(TreeSelect).length).toBe(0);
        expect(rendered.findComponent(SelectDatasetModal).findAll("button").length).toBe(0);
        expect(rendered.findAll("h4").length).toBe(0);
        await expectTranslatedWithStoreType(rendered.find("p"),
            "Importing files - this may take several minutes. Please do not close your browser.",
            "Importation de fichiers - cela peut prendre plusieurs minutes. Veuillez ne pas fermer votre navigateur.",
            "Importação de ficheiros - isto pode demorar vários minutos. Por favor, não feche o seu navegador.",
            store);

        expect(getDatasetMock.mock.calls[0][1].id).toBe("id2");
        expect(getDatasetMock.mock.calls[0][1].release).toStrictEqual(fakeRelease);
        expect(getDatasetMock.mock.calls[0][1].datasetType).toStrictEqual(AdrDatasetType.Input);

        await flushPromises();

        expect(rendered.find("#loading-dataset").exists()).toBe(false);
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
    });

    it("renders reset confirmation dialog when importing a new dataset and then saves new version and imports if click save", async () => {
        let store = getRootStore({selectedDataset: fakeDataset2}, {}, true);
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        const editBtn = rendered.find("button")
        await editBtn.trigger("click");
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(true);
        const importBtn = rendered.findComponent(SelectDatasetModal).find("button")
        await importBtn.trigger("click");
        expect((rendered.findComponent(ResetConfirmation).props() as any).open).toBe(true);
        const saveBtn = rendered.findComponent(ResetConfirmation).find("button");
        await expectTranslatedWithStoreType(saveBtn, "Save version and keep editing",
            "Sauvegarder la version et continuer à modifier", "Guardar versão e continuar a editar",
            store);
        await saveBtn.trigger("click");
        store.state.projects.currentVersion = {id: "id1"} as any;
        await nextTick();
        expect(rendered.findComponent(ResetConfirmation).exists()).toBe(false);
        expect(rendered.find("#loading-dataset").findComponent(LoadingSpinner).exists()).toBe(true);
        await flushPromises();
        expect(rendered.find("#loading-dataset").exists()).toBe(false);
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
    });

    it("renders reset confirmation dialog when changing selected dataset and closes if click cancel", async () => {
        let store = getRootStore({selectedDataset: fakeDataset}, {}, true);
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        const editBtn = rendered.find("button")
        await editBtn.trigger("click");
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(true);
        await rendered.setData({newDatasetId: "id2"});
        const importBtn = rendered.findComponent(SelectDatasetModal).find("button")
        await importBtn.trigger("click");
        expect((rendered.findComponent(ResetConfirmation).props() as any).open).toBe(true);
        const cancelBtn = rendered.findComponent(ResetConfirmation).findAll("button")[1];
        await expectTranslatedWithStoreType(cancelBtn, "Cancel editing",
            "Annuler l'édition", "Cancelar edição", store);
        await cancelBtn.trigger("click");
        expect(rendered.findComponent(ResetConfirmation).exists()).toBe(false);
        expect(rendered.find("#loading-dataset").exists()).toBe(false);
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
    });

    it("confirmImport imports baseline files if they exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    pjnz: mockDatasetResource(pjnz),
                    pop: mockDatasetResource(pop),
                    shape: mockDatasetResource(shape)
                }
            }
        });
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.pjnz");
        expect((baselineActions.importPopulation as Mock).mock.calls[0][1]).toBe("pop.csv");
        expect((baselineActions.importShape as Mock).mock.calls[0][1]).toBe("shape.geojson");

        await flushPromises();

        expect(rendered.find("#loading-dataset").exists()).toBe(false);
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("confirmImport does not import baseline file if it doesn't exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    pjnz: mockDatasetResource(pjnz)
                }
            }
        });
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((baselineActions.importPJNZ as Mock).mock.calls[0][1]).toBe("pjnz.pjnz");
        expect((baselineActions.importPopulation as Mock).mock.calls.length).toBe(0);
        expect((baselineActions.importShape as Mock).mock.calls.length).toBe(0);

        await flushPromises();

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("confirmImport does not import baseline file if user does not have permission (ie, relevant dataset in datasets has no resources)", async () => {
        const store = getStore(
            {}, {}, false,
            {
                selectedDatasetAvailableResources: () => {
                    return {}
                }
            }
        );
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((baselineActions.importPJNZ as Mock).mock.calls.length).toBe(0);
        expect((baselineActions.importPopulation as Mock).mock.calls.length).toBe(0);
        expect((baselineActions.importShape as Mock).mock.calls.length).toBe(0);

        await flushPromises();

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("confirmImport imports survey and program files if they exist and shape file exists", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    shape: mockDatasetResource(shape),
                    survey: mockDatasetResource(survey),
                    program: mockDatasetResource(program),
                    anc: mockDatasetResource(anc),
                    vmmc: mockDatasetResource(vmmc)
                }
            }
        });

        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.csv");
        expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.csv");
        expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.csv");
        expect((surveyProgramActions.importVmmc as Mock).mock.calls[0][1]).toBe("vmmc.xlsx");

        await flushPromises();

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("confirmImport does not import survey and program file if it doesn't exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    shape: mockDatasetResource(shape),
                    survey: mockDatasetResource(survey)
                }
            }
        });
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.csv");
        expect((surveyProgramActions.importProgram as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importANC as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importVmmc as Mock).mock.calls.length).toBe(0);

        await flushPromises();

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("confirmImport does not import any survey and program files if shape file doesn't exist", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                        survey: mockDatasetResource(survey),
                        program: mockDatasetResource(program),
                    anc: mockDatasetResource(anc)
                }
            }
        });
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importProgram as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importANC as Mock).mock.calls.length).toBe(0);
        expect((surveyProgramActions.importVmmc as Mock).mock.calls.length).toBe(0);

        await flushPromises();

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("confirmImport imports survey and program files if pre-existing shape file is present", async () => {
        const store = getStore({}, {}, false, {
            selectedDatasetAvailableResources: () => {
                return {
                    shape: mockDatasetResource(shape),
                    survey: mockDatasetResource(survey),
                    program: mockDatasetResource(program),
                    anc: mockDatasetResource(anc),
                    vmmc: mockDatasetResource(vmmc),
                }
            }
        });
        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });

        await rendered.setData({open: true});

        (rendered.vm as any).confirmImport("id1", null);
        expect(rendered.vm.loading).toBeTruthy();
        await flushPromises();

        expect((surveyProgramActions.importSurvey as Mock).mock.calls[0][1]).toBe("survey.csv");
        expect((surveyProgramActions.importProgram as Mock).mock.calls[0][1]).toBe("program.csv");
        expect((surveyProgramActions.importANC as Mock).mock.calls[0][1]).toBe("anc.csv");
        expect((surveyProgramActions.importVmmc as Mock).mock.calls[0][1]).toBe("vmmc.xlsx");

        await flushPromises();

        expect(rendered.vm.loading).toBeFalsy();
        expect(rendered.vm.open).toBeFalsy();
    });

    it("stops polling dataset metadata on beforeDestroy", async () => {
        const store = getStore();
        const rendered = mountADRDataset(store);
        const pollingId = (rendered.vm as any).pollingId;
        const spy = vi.spyOn(window, "clearInterval");
        rendered.unmount();
        expect(spy.mock.calls[0][0]).toBe(pollingId);
    });

    it("does not start polling if release is selected", async () => {
        const store = getStore(
            {
                selectedDataset: {
                    ...fakeDatasetWithRelease
                }
            }
        );

        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        const clearInterval = vi.spyOn(window, "clearInterval");
        const setInterval = vi.spyOn(window, "setInterval");

        await rendered.find("button").trigger("click");

        const hintTreeSelect = rendered.findComponent(HintTreeSelect)
        expect(hintTreeSelect.exists()).toBe(true)

        const treeSelect = rendered.findComponent(TreeSelect)
        expect(treeSelect.exists()).toBe(true);
        treeSelect.vm.$emit("select", "id1")

        await rendered.findComponent(SelectDatasetModal).find("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);

        await flushPromises();

        expect(rendered.find("#loading-dataset").exists()).toBe(false);
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
        expect(clearInterval.mock.calls.length).toBe(0);
        expect(setInterval.mock.calls.length).toBe(0);
    });

    it("starts polling for update if selected dataset is not release", async () => {
        const store = getStore(
            {
                selectedDataset: {
                    ...fakeDataset
                }
            }
        );

        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        const clearInterval = vi.spyOn(window, "clearInterval");
        const setInterval = vi.spyOn(window, "setInterval");
        const pollingId = (rendered.vm as any).pollingId;

        await rendered.find("button").trigger("click");

        const treeSelect = rendered.findComponent(TreeSelect)
        expect(treeSelect.exists()).toBe(true);
        await treeSelect.vm.$emit("update:modelValue", "id1")
        const button = rendered.findComponent(SelectDatasetModal).find("button");
        await button.trigger("click");
        await flushPromises();
        expect(rendered.find("#loading-dataset").exists()).toBe(false);
        expect((rendered.findComponent(SelectDatasetModal).props() as any).open).toBe(false);
        expect(clearInterval.mock.calls[0][0]).toBe(pollingId);
        expect(setInterval.mock.calls[0][0]).toBe((rendered.vm as any).refreshDatasetMetadata);
        expect(setInterval.mock.calls[0][1]).toBe(10000);
    });

    it("deletes previously imported files if population file exist", async () => {

        const baselineProp = {
            population: mockPopulationResponse()
        }

        await testDeleteImportedFiles(baselineProp);
    });

    it("deletes previously imported files if shape file exist", async () => {

        const baselineProp = {
            shape: mockShapeResponse()
        }

        await testDeleteImportedFiles(baselineProp);
    });

    it("deletes previously imported files if pjnz file exist", async () => {

        const baselineProp = {
            pjnz: mockPJNZResponse()
        }

        await testDeleteImportedFiles(baselineProp);
    });

    it("does not delete previously imported files if it does not exist", async () => {
        const store = getStore(
            {
                shape: null,
                pjnz: null,
                population: null,
                selectedDataset: {
                    ...fakeDataset,
                    resources: {} as any
                }
            }, {}
        );

        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.find("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        await rendered.setData({newDatasetId: "id1"})
        await rendered.findComponent(SelectDatasetModal).find("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);
        expect((baselineActions.deleteAll as Mock)).not.toHaveBeenCalled()
    });

    const testDeleteImportedFiles = async (baselineProps: Partial<BaselineState>) => {
        const store = getStore(
            {
                shape: null,
                pjnz: null,
                population: null,
                selectedDataset: {
                    ...fakeDataset,
                    resources: {} as any
                },
                ...baselineProps,
            }
        );

        const rendered = mountADRDataset(store, {
            stubs: ["treeselect"]
        });
        await rendered.find("button").trigger("click");

        expect(rendered.findAllComponents(TreeSelect).length).toBe(1);
        await rendered.findComponent(SelectDatasetModal).find("button").trigger("click");

        expect(rendered.findAllComponents(LoadingSpinner).length).toBe(1);
        expect((baselineActions.deleteAll as Mock)).toHaveBeenCalled()
    }
});
