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
                id: 1, name: "v1", snapshots: [
                    {id: "s11", created: isoDates[0], updated: isoDates[1]},
                    {id: "s12", created: isoDates[1], updated: isoDates[2]}]
            },
            {
                id: 2, name: "v2", snapshots: [
                    {id: "s21", created: isoDates[2], updated: isoDates[3]}]
            }
        ]
    };

    const getWrapper = (propsData = testPropsData, store = testStore) => {
        return mount(ProjectHistory, {store, propsData});
    };

    const testRendersProject = (wrapper: Wrapper<any>, id: number, name: string, updatedIsoDate: string) => {
        const v = wrapper.find(`#v-${id}`).findAll(".project-cell");
        const button = v.at(0).find("button");
        expect(button.classes()).toContain("collapsed");
        const svg = button.findAll("svg");
        expect(svg.at(0).classes()).toContain("when-closed");
        expect(svg.at(0).classes()).toContain("feather-chevron-right");
        expect(svg.at(1).classes()).toContain("when-open");
        expect(svg.at(1).classes()).toContain("feather-chevron-down");
        expect(v.at(1).text()).toBe(name);
        expect(v.at(2).text()).toBe(formatDateTime(updatedIsoDate));

        const snapshots = wrapper.find(`#snapshots-${id}`);
        expect(snapshots.classes()).toContain("collapse");
        expect(snapshots.attributes("style")).toBe("display: none;");
    };

    const testRendersSnapshot = (row: Wrapper<any>, id: string, updatedIsoDate: string) => {
        expect(row.attributes("id")).toBe(`s-${id}`);
        let cells = row.findAll(".snapshot-cell");
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
        const v1Snapshots = wrapper.find("#snapshots-1");
        const v1SnapshotRows = v1Snapshots.findAll(".row");
        expect(v1SnapshotRows.length).toBe(2);
        testRendersSnapshot(v1SnapshotRows.at(0), "s11", isoDates[1]);
        testRendersSnapshot(v1SnapshotRows.at(1), "s12", isoDates[2]);

        testRendersProject(wrapper, 2, "v2", isoDates[3]);
        const v2Snapshots = wrapper.find("#snapshots-2");
        const v2SnapshotRows = v2Snapshots.findAll(".row");
        expect(v2SnapshotRows.length).toBe(1);
        testRendersSnapshot(v2SnapshotRows.at(0), "s21", isoDates[3]);
    });

    it("can expand project row", async (done) => {
        const wrapper = getWrapper();
        const button = wrapper.find("#v-1 button");
        button.trigger("click");
        setTimeout(() => {
            expect(button.classes()).toContain("not-collapsed");
            expect(wrapper.find("#snapshots-1").attributes("style")).toBe("");
            done();
        });
    });

    it("can collapse project row", async (done) => {
        const wrapper = getWrapper();
        const button = wrapper.find("#v-1 button");
        button.trigger("click");
        setTimeout(() => {
            expect(button.classes()).toContain("not-collapsed");
            button.trigger("click");
            setTimeout(() => {
                expect(button.classes()).toContain("collapsed");
                expect(wrapper.find("#snapshots-1").attributes("style")).toBe("display: none;");
                done();
            });
        });
    });

    it("does not render if no previous projects", () => {
        const wrapper = getWrapper({projects: []});
        expect(wrapper.findAll("div").length).toBe(0);
    });

    it("clicking snapshot load link invokes loadSnapshot action", async () => {
        const mockLoad = jest.fn();
        const mockStore = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        loadSnapshot: mockLoad
                    }
                }
            }
        });
        const wrapper = getWrapper(testPropsData, mockStore);
        const snapshotLink = wrapper.find("#snapshots-1").find("a");
        snapshotLink.trigger("click");
        await Vue.nextTick();
        expect(mockLoad.mock.calls.length).toBe(1);
        expect(mockLoad.mock.calls[0][1]).toStrictEqual({versionId: 1, snapshotId: "s11"});
    });
});
