import {actions} from "../../app/store/filteredData/actions";
import {FilterType} from "../../app/store/filteredData/filteredData";

describe("filteredData actions", () => {
    it("commits mutation on filterUpdated", async () => {

        const commit = jest.fn();
        const newFilters = [{id: "s1", name: "survey1"}];
        await actions.filterUpdated({commit} as any, [FilterType.Survey, newFilters]);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "FilterUpdated", payload: [FilterType.Survey, newFilters]});
    });

});