import {mount, Wrapper} from "@vue/test-utils";
import ProjectHistory from "../../../app/components/projects/ProjectHistory.vue";
import {formatDateTime} from "../../../app/utils";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import Vue from "vue";
import {emptyState} from "../../../app/root";

describe("Projects component", () => {

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
                id: 1, name: "v1", versions: [
                    {id: "s11", created: isoDates[0], updated: isoDates[1]},
                    {id: "s12", created: isoDates[1], updated: isoDates[2]}]
            },
            {
                id: 2, name: "v2", versions: [
                    {id: "s21", created: isoDates[2], updated: isoDates[3]}]
            }
        ]
    };

    const getWrapper = (propsData = testPropsData, store = testStore) => {
        return mount(ProjectHistory, {store, propsData});
    };

    const testRendersProject = (wrapper: Wrapper<any>, id: number, name: string, updatedIsoDate: string) => {
        const v = wrapper.find(`#p-${id}`).findAll(".project-cell");
        const button = v.at(0).find("button");
        expect(button.classes()).toContain("collapsed");
        const svg = button.findAll("svg");
        expect(svg.at(0).classes()).toContain("when-closed");
        expect(svg.at(0).classes()).toContain("feather-chevron-right");
        expect(svg.at(1).classes()).toContain("when-open");
        expect(svg.at(1).classes()).toContain("feather-chevron-down");
        expect(v.at(1).text()).toBe(name);
        expect(v.at(2).text()).toBe(formatDateTime(updatedIsoDate));
        expect(v.at(3).text()).toBe("Load last updated");
        expect(v.at(3).find("a").attributes("href")).toBe("");

        const versions = wrapper.find(`#versions-${id}`);
        expect(versions.classes()).toContain("collapse");
        expect(versions.attributes("style")).toBe("display: none;");
    };

    const testRendersVersion = (row: Wrapper<any>, id: string, updatedIsoDate: string) => {
        expect(row.attributes("id")).toBe(`v-${id}`);
        let cells = row.findAll(".version-cell");
        expect(cells.at(0).text()).toBe("");
        expect(cells.at(1).text()).toBe(formatDateTime(updatedIsoDate));
        const loadLink = cells.at(2).find("a");
        expect(loadLink.text()).toBe("Load");
    };

    it("renders as expected ", () => {
        const wrapper = getWrapper();

        expect(wrapper.find("h5").text()).toBe("Project history");

        const headers = wrapper.find("#headers").findAll(".header-cell");
        expect(headers.length).toBe(3);
        expect(headers.at(0).text()).toBe("");
        expect(headers.at(1).text()).toBe("Project name");
        expect(headers.at(2).text()).toBe("Last updated");

        testRendersProject(wrapper, 1, "v1", isoDates[1]);
        const v1Versions = wrapper.find("#versions-1");
        const v1VersionRows = v1Versions.findAll(".row");
        expect(v1VersionRows.length).toBe(2);
        testRendersVersion(v1VersionRows.at(0), "s11", isoDates[1]);
        testRendersVersion(v1VersionRows.at(1), "s12", isoDates[2]);

        testRendersProject(wrapper, 2, "v2", isoDates[3]);
        const v2Versions = wrapper.find("#versions-2");
        const v2VersionRows = v2Versions.findAll(".row");
        expect(v2VersionRows.length).toBe(1);
        testRendersVersion(v2VersionRows.at(0), "s21", isoDates[3]);
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
});


