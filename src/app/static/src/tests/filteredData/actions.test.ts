import {actions} from "../../app/store/filteredData/actions";
import {DataType, FilterType} from "../../app/store/filteredData/filteredData";

describe("filteredData actions", () => {
    it("commits mutation on filterUpdated", async () => {

        const commit = jest.fn();
        const newFilters = [{id: "s1", name: "survey1"}];
        await actions.filterUpdated({commit} as any, [FilterType.Survey, newFilters]);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "FilterUpdated", payload: [FilterType.Survey, newFilters]});
    });

    it("commits mutation on choroplethFilterUpdated", async () => {

        const commit = jest.fn();
        const newFilter = {id: "s1", name: "survey1"};
        await actions.choroplethFilterUpdated({commit} as any, [FilterType.Survey, newFilter]);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "ChoroplethFilterUpdated", payload: [FilterType.Survey, newFilter]});
    });

    it("commits mutation on selectDataType", async () => {

        const commit = jest.fn();
        await actions.selectDataType({commit} as any, DataType.Survey);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Survey});
    });

});