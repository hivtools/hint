import {actions} from "../../app/store/surveyAndProgramData/actions";
import {DataType, FilterType} from "../../app/store/surveyAndProgramData/filteredData";

describe("filteredData actions", () => {


    it("commits mutation on choroplethFilterUpdated", async () => {

        const newFilter = {id: "s1", label: "survey1"};
        const commit = jest.fn();
        await actions.choroplethFilterUpdated({commit} as any, [FilterType.Survey, newFilter]);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "ChoroplethFilterUpdated", payload: [FilterType.Survey, newFilter]});
    });

    it("commits mutation on selectDataType", async () => {

        const commit = jest.fn();
        await actions.selectDataType({commit} as any, DataType.Survey);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Survey});
    });

});