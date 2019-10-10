import {NestedFilterOption} from "../app/generated";
import {flattenOptions} from "../app/utils";

describe("utils", () => {

    it("can flatten options", () => {

        const testData: NestedFilterOption[] = [
            {
                id: "1", name: "name1", options: [{
                    id: "2", name: "nested", options: []
                }]
            }
        ];

        const result = flattenOptions(testData);
        expect(result["1"]).toStrictEqual(testData[0]);
        expect(result["2"]).toStrictEqual({id: "2", name: "nested", options: []});
    });

});
