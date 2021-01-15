import {mount, shallowMount, Wrapper} from "@vue/test-utils";
import ProjectHistory from "../../../app/components/projects/ProjectHistory.vue";
import {formatDateTime} from "../../../app/utils";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import Vuex, {Store} from "vuex";
import Vue from "vue";
import {emptyState, RootState} from "../../../app/root";
import {Project} from "../../../app/types";
import {mockProjectsState} from "../../mocks";
import {expectTranslated} from "../../testHelpers";
import {switches} from "../../../app/featureSwitches";
import ShareProject from "../../../app/components/projects/ShareProject.vue";
import {Language} from "../../../app/store/translations/locales";

describe("Project history component", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    const isoDates = ["2020-07-30T15:00:00.000000",
        "2020-07-31T09:00:00.000000",
        "2020-07-31T10:00:00.000000",
        "2020-08-01T11:00:00.000000"];

    const mockDeleteProject = jest.fn();
    const mockDeleteVersion = jest.fn();
    const mockLoad = jest.fn();
    const mockPromoteVersion = jest.fn();
    const mockRenameProject = jest.fn();

    function createStore(projects: Project[] = testProjects) {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState({previousProjects: projects}),
                    actions: {
                        deleteVersion: mockDeleteVersion,
                        deleteProject: mockDeleteProject,
                        loadVersion: mockLoad,
                        promoteVersion: mockPromoteVersion,
                        renameProject: mockRenameProject
                    }
                }
            }
        });

        registerTranslations(store);
        return store;
    }

    const testProjects = [
        {
            id: 1, name: "proj1", sharedBy : "shared@email.com", versions: [
                {id: "s11", created: isoDates[0], updated: isoDates[1], versionNumber: 1},
                {id: "s12", created: isoDates[1], updated: isoDates[2], versionNumber: 2}]
        },
        {
            id: 2, name: "proj2", versions: [
                {id: "s21", created: isoDates[2], updated: isoDates[3], versionNumber: 1}]
        }
    ];


    const getWrapper = (projects = testProjects) =>  {
        return mount(ProjectHistory, {store: createStore(projects), stubs: ["share-project"]});
    };

    it("renders icons without an error", async () => {
        const wrapper = getWrapper(testProjects);
        expect(wrapper.find("copy-icon").exists).toBeTruthy();
        expect(wrapper.find("trash-2-icon").exists).toBeTruthy();
        expect(wrapper.find("refresh-cw-icon").exists).toBeTruthy();
        expect(wrapper.find("edit-icon").exists).toBeTruthy();
    });
    
    it("can render tooltips without an error", () => {
        const mockTooltip = jest.fn();
        const store = createStore(testProjects)
        shallowMount(ProjectHistory, {store,
             directives: {"tooltip": mockTooltip} });

        expect(mockTooltip.mock.calls[0][1].value).toBe("Load");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Rename project");
        expect(mockTooltip.mock.calls[2][1].value).toBe("Delete");
        expect(mockTooltip.mock.calls[3][1].value).toBe("Copy last updated to a new project");
        expect(mockTooltip.mock.calls[6][1].value).toBe("Copy to a new project");
    });

    it("can render tooltips in french without an error", () => {
        const mockTooltip = jest.fn();
        const store = createStore(testProjects)
        store.state.language = Language.fr;
        shallowMount(ProjectHistory, {store,
        directives: {"tooltip": mockTooltip} });

        expect(mockTooltip.mock.calls[0][1].value).toBe("Charger");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Renommer le projet");
        expect(mockTooltip.mock.calls[2][1].value).toBe("Supprimer");
        expect(mockTooltip.mock.calls[3][1].value).toBe("Copier la dernière mise à jour dans un nouveau projet");
        expect(mockTooltip.mock.calls[6][1].value).toBe("Copier dans un nouveau projet");
    });

    const testRendersProject = (wrapper: Wrapper<any>, id: number, name: string, updatedIsoDate: string,
                                versionsCount: number) => {
        const v = wrapper.find(`#p-${id}`).findAll(".project-cell");
        const button = v.at(0).find("button");
        expect(button.classes()).toContain("collapsed");
        const svg = button.findAll("svg");
        expect(svg.at(0).classes()).toContain("when-closed");
        expect(svg.at(0).classes()).toContain("feather-chevron-right");
        expect(svg.at(1).classes()).toContain("when-open");
        expect(svg.at(1).classes()).toContain("feather-chevron-down");
        expect(v.at(1).text()).toBe(name);
        expect(v.at(1).find("a").text()).toContain(name);
        expect(v.at(2).text()).toBe(versionsCount === 1 ? "1 version" : `${versionsCount} versions`);
        expect(v.at(3).text()).toBe(formatDateTime(updatedIsoDate));

        if (switches.shareProject) {
            expect(wrapper.findAll(ShareProject).length).toBeGreaterThan(0);
        } else {
            expect(wrapper.findAll(ShareProject).length).toBe(0);
        }
        const versions = wrapper.find(`#versions-${id}`);
            expect(versions.classes()).toContain("collapse");
            expect(versions.attributes("style")).toBe("display: none;");
    };

    const testRendersVersion = (row: Wrapper<any>, id: string, updatedIsoDate: string, versionNumber: number,
                                store: Store<RootState>) => {
        expect(row.attributes("id")).toBe(`v-${id}`);
        let cells = row.findAll(".version-cell");
        expect(cells.at(0).text()).toBe("");
        expect(cells.at(1).text()).toBe(`v${versionNumber}`);
        expect(cells.at(2).text()).toBe(formatDateTime(updatedIsoDate));
    };

    it("renders as expected ", () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;

        expect(wrapper.find("h5").text()).toBe("Project history");

        const headers = wrapper.find("#headers").findAll(".header-cell");
        expect(headers.length).toBe(10);
        expect(headers.at(0).text()).toBe("");
        expectTranslated(headers.at(1), "Project name", "Nom du projet", store);
        expectTranslated(headers.at(2), "Versions", "Versions", store);
        expectTranslated(headers.at(3), "Last updated", "Dernière mise à jour", store);
        expectTranslated(headers.at(4), "Load", "Charger", store);
        expectTranslated(headers.at(5), "Rename", "Renommer", store);
        expectTranslated(headers.at(6), "Delete", "Supprimer", store);
        expectTranslated(headers.at(7), "Copy to", "Copier", store);
        expectTranslated(headers.at(8), "Share", "Partager", store);
        expectTranslated(headers.at(9), "Shared by", "Partagé par", store);
        
        testRendersProject(wrapper, 1, "proj1",  isoDates[1], 2);
        const proj1Versions = wrapper.find("#versions-1");
        const proj1VersionRows = proj1Versions.findAll(".row");
        expect(proj1VersionRows.length).toBe(2);
        testRendersVersion(proj1VersionRows.at(0), "s11", isoDates[1], 1, store);
        testRendersVersion(proj1VersionRows.at(1), "s12", isoDates[2], 2, store);

        testRendersProject(wrapper, 2, "proj2", isoDates[3], 1);
        const proj2Versions = wrapper.find("#versions-2");
        const proj2VersionRows = proj2Versions.findAll(".row");
        expect(proj2VersionRows.length).toBe(1);
        testRendersVersion(proj2VersionRows.at(0), "s21", isoDates[3], 1, store);

        const modal = wrapper.find(".modal");
        expect(modal.classes).not.toContain("show");         
    });

    it("can expand project row", async (done) => {
        const wrapper = getWrapper();
        const button = wrapper.find("#p-1 button");
        button.trigger("click");
        setTimeout(() => {
            expect(button.classes()).toContain("not-collapsed");
            expect(wrapper.find("#versions-1").attributes("style")).toBe("");
            done();
        });
    });

    it("can collapse project row", async (done) => {
        const wrapper = getWrapper();
        const button = wrapper.find("#p-1 button");
        button.trigger("click");
        setTimeout(() => {
            expect(button.classes()).toContain("not-collapsed");
            button.trigger("click");
            setTimeout(() => {
                expect(button.classes()).toContain("collapsed");
                expect(wrapper.find("#versions-1").attributes("style")).toBe("display: none;");
                done();
            });
        });
    });
    it("does not render if no previous projects", () => {
        const wrapper = getWrapper([]);
        expect(wrapper.findAll("div").length).toBe(0);
    });

    it("clicking version load link invokes loadVersion action", async () => {
        await testLoadVersionLink("#versions-1", 1, "s11");
    });

    it("clicking project load latest link invokes loadVersion action", async () => {
        await testLoadVersionLink("#p-1", 1, "s11");
    });

    it("shows modal when click delete project link", async () => {
        if (!switches.renameProject) {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const deleteLink = wrapper.find("#p-1").findAll(".project-cell").at(5).find("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");
        expectTranslated(modal.find(".modal-body"), "Delete project?", "Supprimer ce projet?", store);
        const buttons = modal.find(".modal-footer").findAll("button");
        expectTranslated(buttons.at(0), "OK", "OK", store);
        expectTranslated(buttons.at(1), "Cancel", "Annuler", store);
        }
    });

    it("shows modal when click delete version link", async () => {
        if (!switches.renameProject) {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const deleteLink = wrapper.find("#v-s11").findAll(".version-cell").at(4).find("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");
        expectTranslated(modal.find(".modal-body"), "Delete version?", "Supprimer cette version?", store);
        const buttons = modal.find(".modal-footer").findAll("button");
        expectTranslated(buttons.at(0), "OK", "OK", store);
        expectTranslated(buttons.at(1), "Cancel", "Annuler", store);
        }
    });

    it("invokes deleteProject action when confirm delete", async () => {
        if (!switches.renameProject) {
        const wrapper = getWrapper(testProjects);
        const deleteLink = wrapper.find("#p-1").findAll(".project-cell").at(5).find("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const okButton = wrapper.find(".modal").findAll("button").at(0);
        okButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteProject.mock.calls.length).toBe(1);
        expect(mockDeleteProject.mock.calls[0][1]).toBe(1);
        }
    });

    it("invokes deleteVersion action when confirm delete", async () => {
        if (!switches.renameProject) {
        const wrapper = getWrapper(testProjects);
        const deleteLink = wrapper.find("#v-s11").findAll(".version-cell").at(4).find("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const okButton = wrapper.find(".modal").findAll("button").at(0);
        okButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteVersion.mock.calls.length).toBe(1);
        expect(mockDeleteVersion.mock.calls[0][1]).toStrictEqual({projectId: 1, versionId: "s11"});
        }
    });

    it("hides modal and does not invoke action when click cancel", async () => {

        const wrapper = getWrapper(testProjects);
        const deleteLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const cancelButton = wrapper.find(".modal").findAll("button").at(1);
        cancelButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteVersion.mock.calls.length).toBe(0);
        const modal = wrapper.find(".modal");
        expect(modal.classes).not.toContain("show");
    }); 

    const testLoadVersionLink = async function (elementId: string, projectId: number, versionId: string) {
        if (!switches.renameProject) {
        const wrapper = getWrapper(testProjects);
        const versionLink = wrapper.find("#versions-1").find("button");
        versionLink.trigger("click");
        await Vue.nextTick();
        expect(mockLoad.mock.calls.length).toBe(1);
        expect(mockLoad.mock.calls[0][1]).toStrictEqual({projectId: 1, versionId: "s11"});
        }
    };

    it("shows modal when rename project link is clicked and removes it when cancel is clicked", async () => {
        if (switches.renameProject) {
            const wrapper = getWrapper();
            const store = wrapper.vm.$store;
            const renameLink = wrapper.find("#p-1").findAll(".project-cell").at(5).find("button");
            renameLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(2);
            expect(modal.classes()).toContain("show");
            expectTranslated(modal.find(".modal-body h4"), "Please enter a new name for the project",
                "Veuillez entrer un nouveau nom pour le projet", store);

            const input = modal.find("input")
            expectTranslated(input, "Project name", "Nom du projet", store, "placeholder");
            const buttons = modal.find(".modal-footer").findAll("button");
            expectTranslated(buttons.at(0), "Rename project", "Renommer le projet", store);
            expectTranslated(buttons.at(1), "Cancel", "Annuler", store);

            const cancelButton = buttons.at(1);
            cancelButton.trigger("click");
            await Vue.nextTick();
            expect(modal.classes()).not.toContain("show");
        }
    });

    it("methods for rename and cancel rename work regardless of feature switch", async () => {
        const wrapper = getWrapper();
        const mockPreventDefault = jest.fn()
        const mockEvent = { preventDefault: mockPreventDefault }
        wrapper.setData({ projectToRename: null })
        const vm = wrapper.vm as any
        
        vm.renameProject(mockEvent, 123);
        expect(vm.projectToRename).toBe(123);
        expect(mockPreventDefault.mock.calls.length).toStrictEqual(1);

        vm.cancelRename();
        expect(vm.projectToRename).toBe(null);
    });

    it("shows modal when copy project link is clicked and removes it when cancel is clicked", async () => {
        if (switches.promoteProject && !switches.renameProject) {
            const wrapper = getWrapper();
            const store = wrapper.vm.$store;
            const copyLink = wrapper.find("#p-1").findAll(".project-cell").at(6).find("button");
            copyLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(1);
            expect(modal.classes()).toContain("show");
            expectTranslated(modal.find(".modal-body h4"), "Copying version v1 to a new project",
                "Copie de la version v1 dans un nouveau projet", store);
            expectTranslated(modal.find(".modal-body h5"), "Please enter a name for the new project",
                "Veuillez entrer un nom pour le nouveau projet", store);

            const input = modal.find("input")
            expectTranslated(input, "Project name", "Nom du projet", store, "placeholder");
            const buttons = modal.find(".modal-footer").findAll("button");
            expectTranslated(buttons.at(0), "Create project", "Créer un projet", store);
            expectTranslated(buttons.at(1), "Cancel", "Annuler", store);

            const cancelButton = buttons.at(1);
            cancelButton.trigger("click");
            await Vue.nextTick();
            expect(modal.classes()).not.toContain("show");
        }
    });

    it("shows modal when copy version link is clicked and removes it when cancel is clicked", async () => {
        if (switches.promoteProject && !switches.renameProject) {
            const wrapper = getWrapper();
            const store = wrapper.vm.$store;
            const copyLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("button");
            copyLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(1);
            expect(modal.classes()).toContain("show");
            expectTranslated(modal.find(".modal-body h4"), "Copying version v1 to a new project",
                "Copie de la version v1 dans un nouveau projet", store);
            expectTranslated(modal.find(".modal-body h5"), "Please enter a name for the new project",
                "Veuillez entrer un nom pour le nouveau projet", store);
            const input = modal.find("input");
            expectTranslated(input, "Project name", "Nom du projet", store, "placeholder");
            const buttons = modal.find(".modal-footer").findAll("button");
            expectTranslated(buttons.at(0), "Create project", "Créer un projet", store);
            expectTranslated(buttons.at(1), "Cancel", "Annuler", store);

            const cancelButton = buttons.at(1);
            cancelButton.trigger("click");
            await Vue.nextTick();
            expect(modal.classes()).not.toContain("show");
        }
    });

    it("invokes promoteVersion action when confirm copy", async () => {
        if (switches.promoteProject && !switches.renameProject) {
            const wrapper = getWrapper(testProjects);
            const copyLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("button");
            copyLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(1);
            const input = modal.find("input");
            const copyBtn = modal.find(".modal-footer").findAll("button").at(0);
            input.setValue("newProject");
            expect(copyBtn.attributes("disabled")).toBe(undefined);
            copyBtn.trigger("click");

            await Vue.nextTick();

            expect(mockPromoteVersion.mock.calls.length).toBe(1);
            expect(mockPromoteVersion.mock.calls[0][1]).toStrictEqual(
                {
                    "name": "newProject",
                    "version": {
                        "projectId": 1,
                        "versionId": "s11",
                    }
                });
        }
    });

    it("cannot invoke promoteVersion action when input value is empty", async () => {
        if (switches.promoteProject) {
            const wrapper = getWrapper(testProjects);
            const copyLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("button");
            copyLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(1);
            const input = modal.find("input");
            const copyBtn = modal.find(".modal-footer").findAll("button").at(0);
            input.setValue("");
            expect(copyBtn.attributes("disabled")).toBe("disabled");
            copyBtn.trigger("click");

            await Vue.nextTick();

            expect(mockPromoteVersion.mock.calls.length).toBe(0);
        }
    });

    it("invokes renameProject action when confirm rename", async () => {
        if (switches.renameProject) {
            const wrapper = getWrapper(testProjects);
            const vm = wrapper.vm as any
            const renameLink = wrapper.find("#p-1").findAll(".project-cell").at(5).find("button");
            renameLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(2);
            const input = modal.find("input");
            const renameBtn = modal.find(".modal-footer").findAll("button").at(0);
            input.setValue("renamedProject");
            expect(renameBtn.attributes("disabled")).toBe(undefined);
            expect(vm.projectToRename).toBe(1);
            expect(vm.renamedProjectName).toBe("renamedProject");
            renameBtn.trigger("click");

            await Vue.nextTick();

            expect(mockRenameProject.mock.calls.length).toBe(1);
            expect(mockRenameProject.mock.calls[0][1]).toStrictEqual(
                {
                    "name": "renamedProject",
                    "projectId": 1
                });
            expect(vm.projectToRename).toBe(null);
            expect(vm.renamedProjectName).toBe("");
            
        }
    });

    it("cannot invoke renameProject action when input value is empty", async () => {
        if (switches.renameProject) {
            const wrapper = getWrapper(testProjects);
            const renameLink = wrapper.find("#p-1").findAll(".project-cell").at(4).find("button");
            renameLink.trigger("click");
            await Vue.nextTick();

            const modal = wrapper.findAll(".modal").at(2);
            const input = modal.find("input");
            const renameBtn = modal.find(".modal-footer").findAll("button").at(0);
            input.setValue("");
            expect(renameBtn.attributes("disabled")).toBe("disabled");
            renameBtn.trigger("click");

            await Vue.nextTick();

            expect(mockRenameProject.mock.calls.length).toBe(0);
        }
    });

    it("cannot invoke confirmRename if no project is selected", async () => {
            const wrapper = getWrapper(testProjects);
            wrapper.setData({ projectToRename: null });
            wrapper.setData({ renamedProjectName: "renamedProject" })
            const vm = wrapper.vm as any
            vm.confirmRename("renamedProject");
            await Vue.nextTick();
            expect(mockRenameProject.mock.calls.length).toBe(0);
            expect(vm.projectToRename).toBe(null);
            expect(vm.renamedProjectName).toBe("renamedProject");
    });

    it('can render shared by email when project is shared', () => {
        const wrapper = getWrapper();
        const v = wrapper.find(`#p-1`).findAll(".project-cell");
        expect(v.at(9).text()).toBe("shared@email.com")
        expect(v.at(9).classes("d-none")).toBe(false)
    });

    it('does not render shared by email when project is not shared', () => {
        const wrapper = getWrapper();
        const v = wrapper.find(`#p-2`).findAll(".project-cell");
        expect(v.at(9).text()).toBe("")
        expect(v.at(9).classes("d-none")).toBe(true)
    });

    it("does not render sharedBy header when project sharedBy is empty", () => {
        const testSharedProjects = [
            {
                id: 1, name: "proj1",  versions: [
                    {id: "s11", created: isoDates[0], updated: isoDates[1], versionNumber: 1},
                    {id: "s12", created: isoDates[1], updated: isoDates[2], versionNumber: 2}]
            },
            {
                id: 2, name: "proj2", versions: [
                    {id: "s21", created: isoDates[2], updated: isoDates[3], versionNumber: 1}]
            }
        ];
        const wrapper = getWrapper(testSharedProjects);
        const headers = wrapper.find("#headers").findAll(".header-cell");
        expect(headers.at(9).classes("d-none")).toBe(true)
    });

    it("renders sharedBy header when project has sharedBy", () => {
        const testSharedProjects = [
            {
                id: 1, name: "proj1", sharedBy: "shared@email.com", versions: [
                    {id: "s11", created: isoDates[0], updated: isoDates[1], versionNumber: 1},
                    {id: "s12", created: isoDates[1], updated: isoDates[2], versionNumber: 2}]
            },
            {
                id: 2, name: "proj2", versions: [
                    {id: "s21", created: isoDates[2], updated: isoDates[3], versionNumber: 1}]
            }
        ];
        const wrapper = getWrapper(testSharedProjects);
        const headers = wrapper.find("#headers").findAll(".header-cell");
        expect(headers.at(9).classes("d-none")).toBe(false)
    });
});
