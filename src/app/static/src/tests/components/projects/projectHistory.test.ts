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
    const mockUpdateVersion = jest.fn();
    const mockUpdateProjectNote = jest.fn();

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
                        renameProject: mockRenameProject,
                        updateVersionNote: mockUpdateVersion,
                        updateProjectNote: mockUpdateProjectNote
                    }
                }
            }
        });

        registerTranslations(store);
        return store;
    }

    const testProjects = [
        {
            id: 1, name: "proj1", sharedBy: "shared@email.com", note: "project notes", versions: [
                {id: "s11", created: isoDates[0], updated: isoDates[1], versionNumber: 1, note: "version notes"},
                {id: "s12", created: isoDates[1], updated: isoDates[2], versionNumber: 2}]
        },
        {
            id: 2, name: "proj2", versions: [
                {id: "s21", created: isoDates[2], updated: isoDates[3], versionNumber: 1}]
        }
    ];


    const getWrapper = (projects = testProjects) => {
        return mount(ProjectHistory, {store: createStore(projects), stubs: ["share-project"]});
    };

    it("renders icons without an error", async () => {
        const wrapper = getWrapper(testProjects);
        expect(wrapper.findComponent("copy-icon").exists).toBeTruthy();
        expect(wrapper.findComponent("trash-2-icon").exists).toBeTruthy();
        expect(wrapper.findComponent("refresh-cw-icon").exists).toBeTruthy();
        expect(wrapper.findComponent("edit-icon").exists).toBeTruthy();
    });

    it("icon buttons have aria-labels", async () => {
        const store = createStore(testProjects)
        const wrapper = mount(ProjectHistory, {store, stubs: ["share-project"]});
        const buttons = wrapper.findAllComponents("button");

        const expectTranslatedLabel = function (index: number, en: string, fr: string, pt: string) {
            expectTranslated(buttons.at(index), en, fr, pt, store, "aria-label");
        }

        expectTranslatedLabel(0, "toggle version 1",
            "toggle version 1",
            "toggle versão 1");

        expectTranslatedLabel(1, "Add or edit project notes",
            "Ajouter ou modifier des notes de projet",
            "Adicionar ou editar notas do projeto");

        expectTranslatedLabel(2, "Load", "Charger", "Carregar");

        expectTranslatedLabel(3, "Rename project", "Renommer le projet", "Mudar o nome do projeto");

        expectTranslatedLabel(4, "Delete", "Supprimer", "Eliminar");

        expectTranslatedLabel(5, "Copy last updated to a new project",
            "Copier la dernière mise à jour dans un nouveau projet",
            "Copiar última atualização para um novo projeto");

        expectTranslatedLabel(6, "Add or edit version notes",
            "Ajouter ou modifier des notes de version",
            "Adicionar ou editar notas de versão");

        expectTranslatedLabel(7, "Load", "Charger", "Carregar");

        expectTranslatedLabel(8, "Delete", "Supprimer", "Eliminar");

        expectTranslatedLabel(9, "Copy to a new project",
            "Copier dans un nouveau projet",
            "Copiar para um novo projeto");
    });

    it("can render tooltips without an error", () => {
        const mockTooltip = jest.fn();
        const store = createStore(testProjects)
        shallowMount(ProjectHistory, {
            store,
            directives: {"tooltip": mockTooltip}
        });

        expect(mockTooltip.mock.calls[0][1].value).toBe("Add or edit project notes");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Load");
        expect(mockTooltip.mock.calls[2][1].value).toBe("Rename project");
        expect(mockTooltip.mock.calls[3][1].value).toBe("Delete");
        expect(mockTooltip.mock.calls[4][1].value).toBe("Copy last updated to a new project");
        expect(mockTooltip.mock.calls[5][1].value).toBe("Add or edit version notes");
        expect(mockTooltip.mock.calls[8][1].value).toBe("Copy to a new project");
    });

    it("can render tooltips in french without an error", () => {
        const mockTooltip = jest.fn();
        const store = createStore(testProjects)
        store.state.language = Language.fr;
        shallowMount(ProjectHistory, {
            store,
            directives: {"tooltip": mockTooltip}
        });

        expect(mockTooltip.mock.calls[0][1].value).toBe("Ajouter ou modifier des notes de projet");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Charger");
        expect(mockTooltip.mock.calls[2][1].value).toBe("Renommer le projet");
        expect(mockTooltip.mock.calls[3][1].value).toBe("Supprimer");
        expect(mockTooltip.mock.calls[4][1].value).toBe("Copier la dernière mise à jour dans un nouveau projet");
        expect(mockTooltip.mock.calls[5][1].value).toBe("Ajouter ou modifier des notes de version");
        expect(mockTooltip.mock.calls[8][1].value).toBe("Copier dans un nouveau projet");
    });

    it("can render tooltips in Portuguese without an error", () => {
        const mockTooltip = jest.fn();
        const store = createStore(testProjects)
        store.state.language = Language.pt;
        shallowMount(ProjectHistory, {
            store,
            directives: {"tooltip": mockTooltip}
        });

        expect(mockTooltip.mock.calls[0][1].value).toBe("Adicionar ou editar notas do projeto");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Carregar");
        expect(mockTooltip.mock.calls[2][1].value).toBe("Mudar o nome do projeto");
        expect(mockTooltip.mock.calls[3][1].value).toBe("Eliminar");
        expect(mockTooltip.mock.calls[4][1].value).toBe("Copiar última atualização para um novo projeto");
        expect(mockTooltip.mock.calls[5][1].value).toBe("Adicionar ou editar notas de versão");
        expect(mockTooltip.mock.calls[8][1].value).toBe("Copiar para um novo projeto");
    });

    const testRendersProject = (wrapper: Wrapper<any>, id: number, name: string, updatedIsoDate: string,
                                versionsCount: number) => {
        const v = wrapper.findComponent(`#p-${id}`).findAllComponents(".project-cell");
        const button = v[0].findComponent("button");
        expect(button.classes()).toContain("collapsed");
        const svg = button.findAllComponents("svg");
        expect(svg[0].classes()).toContain("when-closed");
        expect(svg[0].classes()).toContain("feather-chevron-right");
        expect(svg[1].classes()).toContain("when-open");
        expect(svg[1].classes()).toContain("feather-chevron-down");
        expect(v[1].findComponent("a").text()).toContain(name);

        const versionCountLabel = versionsCount === 1 ? "1 version" : `${versionsCount} versions`;
        const ptVersionCountLabel = versionsCount === 1 ? "1 versão" : `${versionsCount} versões`;
        expectTranslated(v[2], versionCountLabel, versionCountLabel, ptVersionCountLabel, wrapper.vm.$store);

        expect(v[3].text()).toBe(formatDateTime(updatedIsoDate));
        expect(v[4].classes()).toContain("load-cell");
        expect(v[5].classes()).toContain("rename-cell");
        expect(v[6].classes()).toContain("delete-cell");
        expect(v[7].classes()).toContain("copy-cell");
        expect(v[8].classes()).toContain("share-cell");

        expect(wrapper.findAllComponents(ShareProject).length).toBeGreaterThan(0);

        const versions = wrapper.findComponent(`#versions-${id}`);
        expect(versions.classes()).toContain("collapse");
        expect(versions.attributes("style")).toBe("display: none;");
    };

    const testRendersVersion = (row: Wrapper<any>, id: string, updatedIsoDate: string, versionNumber: number,
                                store: Store<RootState>) => {
        expect(row.attributes("id")).toBe(`v-${id}`);
        let cells = row.findAllComponents(".version-cell");
        expect(cells[0].text()).toBe("");
        expect(cells[1].findComponent("button").exists()).toBe(true);
        expect(cells[2].text()).toBe(`v${versionNumber}`);
        expect(cells[3].text()).toBe(formatDateTime(updatedIsoDate));
        expect(cells[4].classes()).toContain("load-cell");
        expect(cells[5].isEmpty()).toBe(true);
        expect(cells[6].classes()).toContain("delete-cell");
        expect(cells[7].classes()).toContain("copy-cell");
    };

    it("renders as expected ", () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;

        expect(wrapper.findComponent("h5").text()).toBe("Project history");

        const headers = wrapper.findComponent("#headers").findAllComponents(".header-cell");
        expect(headers.length).toBe(9);
        expect(headers[0].text()).toBe("");
        expectTranslated(headers[1], "Project name", "Nom du projet", "Nome do projeto", store);
        expectTranslated(headers[2], "Versions", "Versions", "Versões", store);
        expectTranslated(headers[3], "Last updated", "Dernière mise à jour", "Última atualização", store);
        expectTranslated(headers[4], "Load", "Charger", "Carregar", store);
        expectTranslated(headers[5], "Rename", "Renommer le projet", "Mudar o nome", store);
        expectTranslated(headers[6], "Delete", "Supprimer", "Eliminar", store);
        expectTranslated(headers[7], "Copy to", "Copier", "Copiar para", store);
        expectTranslated(headers[8], "Share", "Partager", "Partilhar", store);

        testRendersProject(wrapper, 1, "proj1", isoDates[1], 2);
        const proj1Versions = wrapper.findComponent("#versions-1");
        const proj1VersionRows = proj1Versions.findAllComponents(".row");
        expect(proj1VersionRows.length).toBe(2);
        testRendersVersion(proj1VersionRows[0], "s11", isoDates[1], 1, store);
        testRendersVersion(proj1VersionRows[1], "s12", isoDates[2], 2, store);

        testRendersProject(wrapper, 2, "proj2", isoDates[3], 1);
        const proj2Versions = wrapper.findComponent("#versions-2");
        const proj2VersionRows = proj2Versions.findAllComponents(".row");
        expect(proj2VersionRows.length).toBe(1);
        testRendersVersion(proj2VersionRows[0], "s21", isoDates[3], 1, store);

        const modal = wrapper.findComponent(".modal");
        expect(modal.classes).not.toContain("show");
    });

    it("can expand project row",  (done) => {
        const wrapper = getWrapper();
        const button = wrapper.findComponent("#p-1 button");
        button.trigger("click");
        setTimeout(() => {
            expect(button.classes()).toContain("not-collapsed");
            expect(wrapper.findComponent("#versions-1").attributes("style")).toBe("");
            done();
        });
    });

    it("can collapse project row",  (done) => {
        const wrapper = getWrapper();
        const button = wrapper.findComponent("#p-1 button");
        button.trigger("click");
        setTimeout(() => {
            expect(button.classes()).toContain("not-collapsed");
            button.trigger("click");
            setTimeout(() => {
                expect(button.classes()).toContain("collapsed");
                expect(wrapper.findComponent("#versions-1").attributes("style")).toBe("display: none;");
                done();
            });
        });
    });
    it("does not render if no previous projects", () => {
        const wrapper = getWrapper([]);
        expect(wrapper.findAllComponents("div").length).toBe(0);
    });

    it("clicking version load link invokes loadVersion action", async () => {
        await testLoadVersionLink("#versions-1", 1, "s11");
    });

    it("clicking project load latest link invokes loadVersion action", async () => {
        await testLoadVersionLink("#p-1", 1, "s11");
    });

    it("shows modal when click delete project link", async () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const deleteLink = wrapper.findComponent("#p-1").findComponent(".project-cell.delete-cell").findComponent("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findComponent(".modal");
        expect(modal.classes()).toContain("show");
        expectTranslated(modal.findComponent(".modal-body"), "Delete project?", "Supprimer ce projet?", "Eliminar projeto?", store);
        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "OK", "OK", "OK", store);
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store);
    });

    it("shows modal when click delete version link", async () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const deleteLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.delete-cell").findComponent("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findComponent(".modal");
        expect(modal.classes()).toContain("show");
        expectTranslated(modal.findComponent(".modal-body"), "Delete version?",
            "Supprimer cette version?", "Eliminar versão?", store);
        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "OK", "OK", "OK", store);
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store);
    });

    it("invokes deleteProject action when confirm delete", async () => {
        const wrapper = getWrapper(testProjects);
        const deleteLink = wrapper.findComponent("#p-1").findComponent(".project-cell.delete-cell").findComponent("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const okButton = wrapper.findComponent(".modal").findAllComponents("button")[0];
        okButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteProject.mock.calls.length).toBe(1);
        expect(mockDeleteProject.mock.calls[0][1]).toBe(1);
    });

    it("invokes deleteVersion action when confirm delete", async () => {
        const wrapper = getWrapper(testProjects);
        const deleteLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.delete-cell").findComponent("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const okButton = wrapper.findComponent(".modal").findAllComponents("button")[0];
        okButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteVersion.mock.calls.length).toBe(1);
        expect(mockDeleteVersion.mock.calls[0][1]).toStrictEqual({projectId: 1, versionId: "s11"});
    });

    it("hides delete modal and does not invoke action when click cancel", async () => {
        const wrapper = getWrapper(testProjects);
        const deleteLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.delete-cell").findComponent("button");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const cancelButton = wrapper.findComponent(".modal").findAllComponents("button")[1];
        cancelButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteVersion.mock.calls.length).toBe(0);
        const modal = wrapper.findComponent(".modal");
        expect(modal.classes).not.toContain("show");
    });

    const testLoadVersionLink = async function (elementId: string, projectId: number, versionId: string) {
        const wrapper = getWrapper(testProjects);
        const versionLink = wrapper.findComponent("#versions-1").findAllComponents("button")[1];
        versionLink.trigger("click");
        await Vue.nextTick();
        expect(mockLoad.mock.calls.length).toBe(1);
        expect(mockLoad.mock.calls[0][1]).toStrictEqual({projectId: 1, versionId: "s11"});
    };

    it("does show project name as default value when a user clicks rename link", async () => {
        const wrapper = getWrapper(testProjects);
        const renameLink = wrapper.findComponent("#p-1").findAllComponents(".project-cell")[5].findComponent("button");
        renameLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[2];
        const proj1 = modal.findComponent("input")
        const projectName1 = proj1.element as HTMLInputElement
        expect(projectName1.value).toBe("proj1")
    });

    it("does show project name as default value when a user clicks copy project", async () => {
        const wrapper = getWrapper();
        const copyLink = wrapper.findComponent("#p-1").findAllComponents(".project-cell");

        copyLink[7].findComponent("button").trigger("click")
        await Vue.nextTick();
        const modal = wrapper.findAllComponents(".modal")[1];
        const proj1 = modal.findComponent("input")
        const projectName1 = proj1.element as HTMLInputElement
        expect(projectName1.value).toBe("proj1")


        copyLink[5].findComponent("button").trigger("click")
        await Vue.nextTick();
        const modalVersion = wrapper.findAllComponents(".modal")[1];
        const projVersion = modalVersion.findComponent("input")
        const projectNameVersion = projVersion.element as HTMLInputElement
        expect(projectNameVersion.value).toBe("proj1")
    });

    it("shows modal when rename project link is clicked and removes it when cancel is clicked", async () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const renameLink = wrapper.findComponent("#p-1").findComponent(".project-cell.rename-cell").findComponent("button");
        renameLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[2];
        expect(modal.classes()).toContain("show");
        expectTranslated(modal.findComponent(".modal-body label.h4"), "Please enter a new name for the project",
            "Veuillez entrer un nouveau nom pour le projet",
            "Por favor, introduza um novo nome para o projeto", store);

        expectTranslated(modal.findComponent(".modal-body label.h5"), "Notes: (your reason for renaming the project)",
            "Remarques : (la raison pour laquelle vous avez renommé le projet)",
            "Notas: (seu motivo para renomear o projeto)", store);

        const input = modal.findComponent("input")
        expectTranslated(input, "Project name", "Nom du projet", "Nome do projeto",
            store, "placeholder");
        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "Rename project", "Renommer le projet",
            "Mudar o nome do projeto", store);
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store);

        const cancelButton = buttons[1];
        cancelButton.trigger("click");
        await Vue.nextTick();
        expect(modal.classes()).not.toContain("show");
    });

    it("methods for rename and cancel rename work regardless of feature switch", async () => {
        const wrapper = getWrapper();
        const mockPreventDefault = jest.fn()
        const mockEvent = {preventDefault: mockPreventDefault}
        wrapper.setData({projectToRename: null})
        const vm = wrapper.vm as any

        vm.renameProject(mockEvent, 123);
        expect(vm.projectToRename).toBe(123);
        expect(mockPreventDefault.mock.calls.length).toStrictEqual(1);

        vm.cancelRename();
        expect(vm.projectToRename).toBe(null);
    });

    it("shows modal when copy project link is clicked and removes it when cancel is clicked", async () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const copyLink = wrapper.findComponent("#p-1").findComponent(".project-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];

        expect(modal.classes()).toContain("show");

        expectTranslated(modal.findComponent(".modal-body h4"), "Copying version v1 to a new project",
            "Copie de la version v1 dans un nouveau projet",
            "A copiar versão v1 para um novo projeto",
            store);

        expectTranslated(modal.findComponent(".modal-body label.h5"),
            "Please enter a name for the new project",
            "Veuillez saisir un nom pour le nouveau projet",
            "Insira um nome para o novo projeto",
            store);

        const input = modal.findComponent("input")
        expectTranslated(input, "Project name", "Nom du projet", "Nome do projeto", store, "placeholder");
        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "Create project", "Créer un projet", "Criar projeto", store);
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store);

        const cancelButton = buttons[1];
        cancelButton.trigger("click");
        await Vue.nextTick();
        expect(modal.classes()).not.toContain("show");

    });

    it("shows modal when copy version link is clicked and removes it when cancel is clicked", async () => {
        const wrapper = getWrapper();
        const store = wrapper.vm.$store;
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];

        expect(modal.classes()).toContain("show");

        expectTranslated(modal.findComponent(".modal-body h4"), "Copying version v1 to a new project",
            "Copie de la version v1 dans un nouveau projet",
            "A copiar versão v1 para um novo projeto",
            store);

        expectTranslated(modal.findComponent(".modal-body label.h5"),
            "Please enter a name for the new project",
            "Veuillez saisir un nom pour le nouveau projet",
            "Insira um nome para o novo projeto",
            store);
        const input = modal.findComponent("input");
        expectTranslated(input, "Project name", "Nom du projet", "Nome do projeto", store, "placeholder");
        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "Create project", "Créer un projet", "Criar projeto", store);
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store);

        const cancelButton = buttons[1];
        cancelButton.trigger("click");
        await Vue.nextTick();
        expect(modal.classes()).not.toContain("show");
    });

    it("invokes promoteVersion action when confirm copy", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];
        const input = modal.findComponent("input");
        const copyBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("newProject");
        expect(copyBtn.attributes("disabled")).toBe(undefined);
        copyBtn.trigger("click");

        await Vue.nextTick();

        expect(mockPromoteVersion.mock.calls.length).toBe(1);
        expect(mockPromoteVersion.mock.calls[0][1]).toStrictEqual(
            {
                "name": "newProject",
                "note": "version notes",
                "version": {
                    "projectId": 1,
                    "versionId": "s11",
                }
            });
    });

    it("can use carriage return to invokes promoteVersion action when confirm copy", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];
        const input = modal.findComponent("input");
        const copyBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("newProject");
        expect(copyBtn.attributes("disabled")).toBe(undefined);
        await input.trigger("keyup.enter")

        expect(mockPromoteVersion.mock.calls.length).toBe(1);
        expect(mockPromoteVersion.mock.calls[0][1]).toStrictEqual(
            {
                "name": "newProject",
                "note": "version notes",
                "version": {
                    "projectId": 1,
                    "versionId": "s11"
                }
            });
    });

    it("invokes versionNote action when ok button is triggered", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.edit-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[3];
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("block")
        const textarea = modal.findComponent("textarea");
        textarea.setValue("new notes");

        const noteText = textarea.element as HTMLTextAreaElement
        expect(noteText.value).toBe("new notes")
        expect(wrapper.vm.$data.editedNote).toBe("new notes")

        const okBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        await okBtn.trigger("click");

        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("none")
        expect(mockUpdateProjectNote.mock.calls.length).toBe(0);
        expect(mockUpdateVersion.mock.calls.length).toBe(1);
        expect(mockUpdateVersion.mock.calls[0][1]).toStrictEqual(
            {
                "note": "new notes",
                "version": {
                    "projectId": 1,
                    "versionId": "s11"
                }
            });
    });

    it("invokes projectNote action when ok button is triggered", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#p-1").findComponent(".project-cell.name-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[3];
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("block")
        const textarea = modal.findComponent("textarea");
        textarea.setValue("new notes");

        const noteText = textarea.element as HTMLTextAreaElement
        expect(noteText.value).toBe("new notes")
        expect(wrapper.vm.$data.editedNote).toBe("new notes")

        const okBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        await okBtn.trigger("click");

        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("none")
        expect(mockUpdateVersion.mock.calls.length).toBe(0);
        expect(mockUpdateProjectNote.mock.calls.length).toBe(1);
        expect(mockUpdateProjectNote.mock.calls[0][1]).toStrictEqual(
            {
                "note": "new notes",
                "projectId": 1
            });
    });

    it("can render pre-populate versionNote correctly when add/edit icon is triggered", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.edit-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[3];
        const noteText = modal.findComponent("textarea").element as HTMLTextAreaElement
        expect(noteText.value).toBe("version notes")
    });

    it("can render pre-populate projectNote correctly when add/edit icon is triggered", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#p-1").findComponent(".project-cell.name-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[3];
        const noteText = modal.findComponent("textarea").element as HTMLTextAreaElement
        expect(noteText.value).toBe("project notes")
    });

    it("cancels projectNote modal when cancel button is triggered", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#p-1").findComponent(".project-cell.name-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();
        const modal = wrapper.findAllComponents(".modal")[3];
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("block")
        expect(wrapper.vm.$data.projectNoteToEdit).toBe(1)

        const cancelBtn = modal.findComponent(".modal-footer").findAllComponents("button")[1];
        await cancelBtn.trigger("click");

        expect(wrapper.vm.$data.projectNoteToEdit).toBe(null)
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("none")
        expect(mockUpdateVersion.mock.calls.length).toBe(0);
    });

    it("cancels versionNote modal when cancel button is triggered", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.edit-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();
        const modal = wrapper.findAllComponents(".modal")[3];
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("block")
        expect(wrapper.vm.$data.versionNoteToEdit).toMatchObject({"projectId": 1, "versionId": "s11"})

        const cancelBtn = modal.findComponent(".modal-footer").findAllComponents("button")[1];
        await cancelBtn.trigger("click");

        expect(wrapper.vm.$data.versionNoteToEdit).toBe(null)
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("none")
        expect(mockUpdateVersion.mock.calls.length).toBe(0);
    });

    it("can render translated versionNote headers and button text", async () => {
        const wrapper = getWrapper(testProjects);
        const store = wrapper.vm.$store
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.edit-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[3];
        const editVersionNoteHeader = modal.findComponent("#editVersionNoteHeader")
        expectTranslated(editVersionNoteHeader, "Project notes for version v1",
            "Notes de projet pour la version v1", "Notas do projeto para a versão v1", store)

        const editVersionNoteSubHeader = modal.findComponent("#editVersionNoteSubHeader")
        expectTranslated(editVersionNoteSubHeader, "Add or edit version notes for proj1",
            "Ajouter ou modifier des notes de version pour proj1",
            "Adicionar ou editar notas de versão para proj1", store)

        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "OK", "OK", "OK", store)
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store)
    });

    it("can render translated projectNote headers and button text", async () => {
        const wrapper = getWrapper(testProjects);
        const store = wrapper.vm.$store
        const copyLink = wrapper.findComponent("#p-1").findComponent(".project-cell.name-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[3];

        const editProjectNoteSubHeader = modal.findComponent("#editProjectNoteSubHeader")
        expectTranslated(editProjectNoteSubHeader, "Add or edit project notes for proj1",
            "Ajouter ou modifier des notes de projet pour proj1", "Adicionar ou editar notas de projeto para proj1",
            store)

        const editProjectNoteHeader = modal.findComponent("#editProjectNoteHeader")
        expectTranslated(editProjectNoteHeader, "Project notes",
            "Notes de projet", "Notas do projeto", store)

        const buttons = modal.findComponent(".modal-footer").findAllComponents("button");
        expectTranslated(buttons[0], "OK", "OK", "OK", store)
        expectTranslated(buttons[1], "Cancel", "Annuler", "Cancelar", store)
    });

    it("cannot invoke promoteVersion action when input value is empty", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];
        const input = modal.findComponent("input");
        const copyBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("");
        expect(copyBtn.attributes("disabled")).toBe("disabled");
        copyBtn.trigger("click");
        await Vue.nextTick();

        expect(mockPromoteVersion.mock.calls.length).toBe(0);
    });

    it("does not use carriage return to invoke promoteVersion action when input is empty", async () => {
        const wrapper = getWrapper(testProjects);
        const vm = wrapper.vm as any
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];
        const input = modal.findComponent("input");
        const renameBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        await input.setValue("");

        expect(renameBtn.attributes("disabled")).toBe("disabled");
        await input.trigger("keyup.enter")

        /**
         *  modal remains open after trigger, promoteVersionAction is not invoked and
         *  versionToPromote is not set to null
         */
        expect((modal.element as HTMLElement).style.getPropertyValue("display")).toBe("block")
        expect(mockPromoteVersion.mock.calls.length).toBe(0);
        expect(vm.versionToPromote).toEqual({"projectId": 1, "versionId": "s11"});
        expect(vm.newProjectName).toBe("");
    });

    it("invokes renameProject action when confirm rename", async () => {
        const wrapper = getWrapper(testProjects);
        const vm = wrapper.vm as any
        const renameLink = wrapper.findComponent("#p-1").findComponent(".project-cell.rename-cell").findComponent("button");
        renameLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[2];
        const input = modal.findComponent("input");
        const textarea = modal.findComponent("textarea");
        const renameBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("renamedProject");
        textarea.setValue("renamed for no reason")
        expect(renameBtn.attributes("disabled")).toBe(undefined);
        expect(vm.projectToRename).toBe(1);
        expect(vm.renamedProjectName).toBe("renamedProject");
        renameBtn.trigger("click");

        await Vue.nextTick();

        expect(mockRenameProject.mock.calls.length).toBe(1);
        expect(mockRenameProject.mock.calls[0][1]).toStrictEqual(
            {
                "name": "renamedProject",
                "note": "renamed for no reason",
                "projectId": 1
            });
        expect(vm.projectToRename).toBe(null);
        expect(vm.renamedProjectName).toBe("");
    });

    it("cannot invoke renameProject action when input value is empty", async () => {
        const wrapper = getWrapper(testProjects);
        const renameLink = wrapper.findComponent("#p-1").findComponent(".project-cell.rename-cell").findComponent("button");
        renameLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[2];
        const input = modal.findComponent("input");
        const renameBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("");
        expect(renameBtn.attributes("disabled")).toBe("disabled");
        renameBtn.trigger("click");

        await Vue.nextTick();

        expect(mockRenameProject.mock.calls.length).toBe(0);
    });

    it("can use carriage return to invoke renameProject action", async () => {
        const wrapper = getWrapper(testProjects);
        const vm = wrapper.vm as any
        const renameLink = wrapper.findComponent("#p-1").findAllComponents(".project-cell")[5].findComponent("button");
        renameLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[2];
        const input = modal.findComponent("input");
        const renameBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("renamedProject");
        expect(renameBtn.attributes("disabled")).toBe(undefined);
        await input.trigger("keyup.enter")

        expect(mockRenameProject.mock.calls.length).toBe(1);
        expect(mockRenameProject.mock.calls[0][1]).toStrictEqual(
            {
                "name": "renamedProject",
                "note": "project notes",
                "projectId": 1
            });
        expect(vm.projectToRename).toBe(null);
        expect(vm.renamedProjectName).toBe("");
    });

    it("cannot invoke confirmRename if no project is selected", async () => {
        const wrapper = getWrapper(testProjects);
        wrapper.setData({projectToRename: null});
        wrapper.setData({renamedProjectName: "renamedProject"});
        const vm = wrapper.vm as any
        vm.confirmRename("renamedProject");
        await Vue.nextTick();
        expect(mockRenameProject.mock.calls.length).toBe(0);
        expect(vm.projectToRename).toBe(null);
        expect(vm.renamedProjectName).toBe("renamedProject");
    });

    it('can render shared by email when project is shared', () => {
        const wrapper = getWrapper();
        const v = wrapper.findComponent(`#p-1`).findAllComponents(".project-cell");

        expect(v[1].findAllComponents("small").length).toBe(1)

        const sharedBy = v[1].findComponent("small")
        expect(sharedBy.text()).toBe("Shared by: shared@email.com")

        wrapper.vm.$store.state.language = Language.fr;
        expect(sharedBy.text()).toBe("Partagé par: shared@email.com")

    });

    it('does not render shared by email when project is not shared', () => {
        const wrapper = getWrapper();
        const v = wrapper.findComponent(`#p-2`).findAllComponents(".project-cell");

        expect(v[1].findAllComponents("small").length).toBe(0)
    });

    it("invokes promoteVersion action when confirm copy with note payload", async () => {
        const wrapper = getWrapper(testProjects);
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];
        const input = modal.findComponent("input");
        const copyBtn = modal.findComponent(".modal-footer").findAllComponents("button")[0];
        input.setValue("newProject");
        wrapper.findComponent("#promoteNote textarea").setValue("editable note")

        expect(copyBtn.attributes("disabled")).toBe(undefined);
        copyBtn.trigger("click");

        await Vue.nextTick();
        expect(mockPromoteVersion.mock.calls.length).toBe(1);
        expect(mockPromoteVersion.mock.calls[0][1]).toStrictEqual(
            {
                "name": "newProject",
                "note": "editable note",
                "version": {
                    "projectId": 1,
                    "versionId": "s11",
                }
            });
    });

    it("can render translated copy project notes", async () => {
        const wrapper = getWrapper(testProjects);
        const store = wrapper.vm.$store
        const copyLink = wrapper.findComponent("#v-s11").findComponent(".version-cell.copy-cell").findComponent("button");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAllComponents(".modal")[1];
        const textarea = modal.findComponent("#promoteNote label");
        expectTranslated(textarea, "Notes: (your reason for copying project)",
            "Notes : (votre motif pour copier le projet)", "Notas: (a sua razão para copiar o projeto)", store)
    });

});
