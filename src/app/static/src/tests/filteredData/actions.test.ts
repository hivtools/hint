import {actions} from "../../app/store/filteredData/actions";
import {FilterType} from "../../app/store/filteredData/filteredData";

describe("filteredData actions", () => {
    it("commits mutation on filterAdded", async () => {

        const commit = jest.fn();
        await actions.filterAdded({commit} as any, [FilterType.Survey, "survey1"]);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "FilterAdded", payload: [FilterType.Survey, "survey1"]});
    });

    it("commits mutation on filterRemoved", async () => {

        const commit = jest.fn();
        await actions.filterRemoved({commit} as any, [FilterType.Survey, "survey1"]);

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "FilterRemoved", payload: [FilterType.Survey, "survey1"]});
    });
});