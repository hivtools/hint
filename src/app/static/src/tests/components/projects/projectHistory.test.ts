import {mount, Wrapper} from "@vue/test-utils";
import ProjectHistory from "../../../app/components/projects/ProjectHistory.vue";
import {formatDateTime} from "../../../app/utils";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import Vue from "vue";
import {emptyState} from "../../../app/root";

describe("Project history component", () => {

    const isoDates = ["2020-07-30T15:00:00.000000",
        "2020-07-31T09:00:00.000000",
        "2020-07-31T10:00:00.000000",
        "2020-08-01T11:00:00.000000"];

    const testStore = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(testStore);

    const testPropsData = {
        projects: [
            {
                id: 1, name: "proj1", versions: [
                    {id: "s11", created: isoDates[0], updated: isoDates[1], versionNumber: 1},
                    {id: "s12", created: isoDates[1], updated: isoDates[2], versionNumber: 2}]
            },
            {
                id: 2, name: "proj2", versions: [
                    {id: "s21", created: isoDates[2], updated: isoDates[3], versionNumber: 1}]
            }
        ]
    };

    const getWrapper = (propsData = testPropsData, store = testStore) => {
        return mount(ProjectHistory, {store, propsData});
    };

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
        expect(v.at(2).text()).toBe(versionsCount === 1 ? "1 version" : `${versionsCount} versions`);
        expect(v.at(3).text()).toBe(formatDateTime(updatedIsoDate));
        expect(v.at(4).text()).toBe("Load last updated");
        expect(v.at(4).find("a").attributes("href")).toBe("");
        expect(v.at(5).text()).toBe("Delete");
        expect(v.at(6).text()).toBe("Copy last updated to a new project");
        expect(v.at(6).find("a").attributes("href")).toBe("");

        const versions = wrapper.find(`#versions-${id}`);
        expect(versions.classes()).toContain("collapse");
        expect(versions.attributes("style")).toBe("display: none;");
    };

    const testRendersVersion = (row: Wrapper<any>, id: string, updatedIsoDate: string, versionNumber: number) => {
        expect(row.attributes("id")).toBe(`v-${id}`);
        let cells = row.findAll(".version-cell");
        expect(cells.at(0).text()).toBe("");
        expect(cells.at(1).text()).toBe(`v${versionNumber}`);
        expect(cells.at(2).text()).toBe(formatDateTime(updatedIsoDate));
        const loadLink = cells.at(3).find("a");
        expect(loadLink.text()).toBe("Load");
        const deleteLink = cells.at(4).find("a");
        expect(deleteLink.text()).toBe("Delete");
        const copyLink = cells.at(5).find("a");
        expect(copyLink.text()).toBe("Copy to a new project");
    };

    it("renders as expected ", () => {
        const wrapper = getWrapper();

        expect(wrapper.find("h5").text()).toBe("Project history");

        const headers = wrapper.find("#headers").findAll(".header-cell");
        expect(headers.length).toBe(4);
        expect(headers.at(0).text()).toBe("");
        expect(headers.at(1).text()).toBe("Project name");
        expect(headers.at(2).text()).toBe("Versions");
        expect(headers.at(3).text()).toBe("Last updated");

        testRendersProject(wrapper, 1, "proj1", isoDates[1], 2);
        const proj1Versions = wrapper.find("#versions-1");
        const proj1VersionRows = proj1Versions.findAll(".row");
        expect(proj1VersionRows.length).toBe(2);
        testRendersVersion(proj1VersionRows.at(0), "s11", isoDates[1], 1);
        testRendersVersion(proj1VersionRows.at(1), "s12", isoDates[2], 2);

        testRendersProject(wrapper, 2, "proj2", isoDates[3], 1);
        const proj2Versions = wrapper.find("#versions-2");
        const proj2VersionRows = proj2Versions.findAll(".row");
        expect(proj2VersionRows.length).toBe(1);
        testRendersVersion(proj2VersionRows.at(0), "s21", isoDates[3], 1);

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
        const wrapper = getWrapper({projects: []});
        expect(wrapper.findAll("div").length).toBe(0);
    });

    it("clicking version load link invokes loadVersion action", async () => {
        await testLoadVersionLink("#versions-1", 1, "s11");
    });

    it("clicking project load latest link invokes loadVersion action", async () => {
        await testLoadVersionLink("#p-1", 1, "s11");
    });

    it("shows modal when click delete project link", async () => {
        const wrapper = getWrapper();
        const deleteLink = wrapper.find("#p-1").findAll(".project-cell").at(5).find("a");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");
        expect(modal.find(".modal-body").text()).toBe("Delete project?");
        const buttons = modal.find(".modal-footer").findAll("button");
        expect(buttons.at(0).text()).toBe("OK");
        expect(buttons.at(1).text()).toBe("Cancel");
    });

    it("shows modal when click delete version link", async () => {
        const wrapper = getWrapper();
        const deleteLink = wrapper.find("#v-s11").findAll(".version-cell").at(4).find("a");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");
        expect(modal.find(".modal-body").text()).toBe("Delete version?");
        const buttons = modal.find(".modal-footer").findAll("button");
        expect(buttons.at(0).text()).toBe("OK");
        expect(buttons.at(1).text()).toBe("Cancel");
    });

    it("invokes deleteProject action when confirm delete", async () => {
        const mockDeleteProject = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        deleteProject: mockDeleteProject
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const deleteLink = wrapper.find("#p-1").findAll(".project-cell").at(5).find("a");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const okButton = wrapper.find(".modal").findAll("button").at(0);
        okButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteProject.mock.calls.length).toBe(1);
        expect(mockDeleteProject.mock.calls[0][1]).toBe(1);
    });

    it("invokes deleteVersion action when confirm delete", async () => {
        const mockDeleteVersion = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        deleteVersion: mockDeleteVersion
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const deleteLink = wrapper.find("#v-s11").findAll(".version-cell").at(4).find("a");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const okButton = wrapper.find(".modal").findAll("button").at(0);
        okButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteVersion.mock.calls.length).toBe(1);
        expect(mockDeleteVersion.mock.calls[0][1]).toStrictEqual({projectId: 1, versionId: "s11"});
    });

    it("hides modal and does not invoke action when click cancel", async () => {
        const mockDeleteVersion = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        deleteVersion: mockDeleteVersion
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const deleteLink = wrapper.find("#v-s11").findAll(".version-cell").at(4).find("a");
        deleteLink.trigger("click");
        await Vue.nextTick();

        const cancelButton = wrapper.find(".modal").findAll("button").at(1);
        cancelButton.trigger("click");
        await Vue.nextTick();

        expect(mockDeleteVersion.mock.calls.length).toBe(0);
        const modal = wrapper.find(".modal");
        expect(modal.classes).not.toContain("show");
    });

    const testLoadVersionLink = async function(elementId: string, projectId: number, versionId: string) {
        const mockLoad = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        loadVersion: mockLoad
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const versionLink = wrapper.find("#versions-1").find("a");
        versionLink.trigger("click");
        await Vue.nextTick();
        expect(mockLoad.mock.calls.length).toBe(1);
        expect(mockLoad.mock.calls[0][1]).toStrictEqual({projectId: 1, versionId: "s11"});
    };

    it("shows modal when copy last updated version link is clicked and removes it when cancel is clicked", async () => {
        const wrapper = getWrapper();
        const copyLink = wrapper.find("#p-1").findAll(".project-cell").at(6).find("a");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAll(".modal").at(1);
        expect(modal.classes()).toContain("show");
        expect(modal.find(".modal-body").text()).toBe("Copying version v1 to a new project Please enter a name for the new project");
        const input = modal.find("input")
        expect(input.attributes("placeholder")).toBe("Project name")
        const buttons = modal.find(".modal-footer").findAll("button");
        expect(buttons.at(0).text()).toBe("Create project");
        expect(buttons.at(1).text()).toBe("Cancel");

        const cancelButton = buttons.at(1);
        cancelButton.trigger("click");
        await Vue.nextTick();
        expect(modal.classes()).not.toContain("show");
    });

    it("shows modal when copy version link is clicked and removes it when cancel is clicked", async () => {
        const wrapper = getWrapper();
        const copyLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("a");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAll(".modal").at(1);
        expect(modal.classes()).toContain("show");
        expect(modal.find(".modal-body").text()).toBe("Copying version v1 to a new project Please enter a name for the new project");
        const input = modal.find("input")
        expect(input.attributes("placeholder")).toBe("Project name")
        const buttons = modal.find(".modal-footer").findAll("button");
        expect(buttons.at(0).text()).toBe("Create project");
        expect(buttons.at(1).text()).toBe("Cancel");

        const cancelButton = buttons.at(1);
        cancelButton.trigger("click");
        await Vue.nextTick();
        expect(modal.classes()).not.toContain("show");
    });

    it("invokes copyVersion action when confirm copy", async () => {
        const mockCopyVersion = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        copyVersion: mockCopyVersion
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const copyLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("a");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAll(".modal").at(1);
        const input = modal.find("input");
        const copyBtn = modal.find(".modal-footer").findAll("button").at(0);
        input.setValue("newProject");
        expect(copyBtn.attributes("disabled")).toBe(undefined);
        copyBtn.trigger("click");

        await Vue.nextTick();

        expect(mockCopyVersion.mock.calls.length).toBe(1);
        expect(mockCopyVersion.mock.calls[0][1]).toStrictEqual(
        {"name": "newProject",
           "version": {
              "projectId": 1,
              "versionId": "s11",
           }});
    });

    it("cannot invoke copyVersion action when when input value is empty", async () => {
        const mockCopyVersion = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        copyVersion: mockCopyVersion
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const copyLink = wrapper.find("#v-s11").findAll(".version-cell").at(5).find("a");
        copyLink.trigger("click");
        await Vue.nextTick();

        const modal = wrapper.findAll(".modal").at(1);
        const input = modal.find("input");
        const copyBtn = modal.find(".modal-footer").findAll("button").at(0);
        input.setValue("");
        expect(copyBtn.attributes("disabled")).toBe("disabled");
        copyBtn.trigger("click");

        await Vue.nextTick();

        expect(mockCopyVersion.mock.calls.length).toBe(0);
    });
});
