import {shallowMount} from '@vue/test-utils';
import MapControl from "../../../app/components/plots/MapControl.vue";
import TreeSelect from '@riophae/vue-treeselect'

describe("Map control component", () => {

    it("renders indicator options", () => {
        const wrapper = shallowMount(MapControl);

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "prev", label: "prevalence"},
                {id: "art", label: "ART coverage"}]);
    });

    it("renders detail options", () => {
        const wrapper = shallowMount(MapControl);

        expect(wrapper.findAll(TreeSelect).at(1).props("options"))
            .toStrictEqual([{id: 1, label: "Country"},
                {id: 2, label: "Admin level 2"},
                {id: 3, label: "Admin level 3"},
                {id: 4, label: "Admin level 4"},
                {id: 5, label: "Admin level 5"},
                {id: 6, label: "Admin level 6"}]);
    });

    it("emits indicator-changed event with indicator", () => {
        const wrapper = shallowMount(MapControl);
        wrapper.findAll(TreeSelect).at(0).vm.$emit("input", "art");
        expect(wrapper.emitted("indicator-changed")[0][0]).toBe("art");
    });

    it("emits detail-changed event with detail", () => {
        const wrapper = shallowMount(MapControl);
        wrapper.findAll(TreeSelect).at(1).vm.$emit("input", 3);
        expect(wrapper.emitted("detail-changed")[0][0]).toBe(3);
    });

});
