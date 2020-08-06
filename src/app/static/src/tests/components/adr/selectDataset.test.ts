import Vuex, {ActionTree} from "vuex";
import {mount, shallowMount} from "@vue/test-utils";
import SelectDataset from "../../../app/components/adr/SelectDataset.vue";
import Modal from "../../../app/components/Modal.vue";
import TreeSelect from '@riophae/vue-treeselect'
import {mockRootState} from "../../mocks";

describe("select dataset", () => {

    const fakeDatasets = [{
        id: "id1",
        title: "Some data",
        organization: {title: "org"},
        name: "some-data"
    }]
    const store = new Vuex.Store({
        state: mockRootState({
            adrDatasets: fakeDatasets
        })
    });

    it("renders button", () => {
        const rendered = shallowMount(SelectDataset, {store});
        expect(rendered.find("button").text()).toBe("Select ADR dataset");
    });

    it("can open modal", () => {
        const rendered = shallowMount(SelectDataset, {store});
        expect(rendered.find(Modal).props("open")).toBe(false);
        rendered.find("button").trigger("click");
        expect(rendered.find(Modal).props("open")).toBe(true);
    });

    it("can close modal", () => {
        const rendered = mount(SelectDataset, {store, stubs: ["tree-select"]});
        rendered.find("button").trigger("click");
        expect(rendered.find(Modal).props("open")).toBe(true);
        rendered.find(Modal).findAll("button").at(1).trigger("click");
        expect(rendered.find(Modal).props("open")).toBe(false);
    });

    it("renders select", async () => {
        const rendered = shallowMount(SelectDataset, {store});
        rendered.find("button").trigger("click");
        const select = rendered.find(TreeSelect);
        expect(select.props("multiple")).toBe(false);
        expect(select.props("searchable")).toBe(true);

        const expectedOptions = [{
            id: "id1",
            label: "Some data",
            customLabel: `Some data
                    <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                        (some-data)<br/>
                        <span class="font-weight-bold">org</span>
                    </div>`
        }]
        expect(select.props("options")).toStrictEqual(expectedOptions);
    });

});
