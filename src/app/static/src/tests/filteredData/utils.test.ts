import {
    colorFunctionFromName,
    flattenToIdSet,
    flattenOptions,
    getColor,
    roundToContext
} from "../../app/store/filteredData/utils";
import {interpolateMagma, interpolateWarm} from "d3-scale-chromatic";
import {NestedFilterOption} from "../../app/generated";


describe("FilteredData getters", () => {
    it("colorFunctionFromName returns color function", () => {
        const result = colorFunctionFromName("interpolateMagma");
        expect(result).toBe(interpolateMagma);
    });

    it("colorFunctionFromName returns default color function if named function does not exist", () => {
        const result = colorFunctionFromName("not-a-color-function");
        expect(result).toBe(interpolateWarm);
    });

    it("getColor calculates colour string", () => {
        const result = getColor(0.5, {
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "",
            name: "",
            value_column: ""
        });

        expect(result).toEqual("rgb(151, 151, 151)");
    });

    it("getColor avoids dividing by zero if min equals max", () => {
        const result = getColor(0.5, {
            min: 0.5,
            max: 0.5,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "",
            name: "",
            value_column: ""
        });

        expect(result).toEqual("rgb(255, 255, 255)");
    });

    it("getColor can invert color function", () => {
        const metadata = {
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "",
            name: "",
            value_column: ""
        };
        const result = getColor(0, metadata);

        expect(result).toEqual("rgb(255, 255, 255)"); //0 = white in interpolateGreys

        metadata.invert_scale = true;
        const invertedResult = getColor(0, metadata);

        expect(invertedResult).toEqual("rgb(0, 0, 0)");
    });

    it ("round to context rounds values to 1 more decimal place than the context where context is integer", () => {
        expect(roundToContext(0.1234, 1)).toBe(0.1);
    });

    it ("round to context rounds values to 1 more decimal place than the context where context has fewer decimal places than value", () => {
        expect(roundToContext(0.1234, 0.1)).toBe(0.12);
    });

    it ("round to context does not round value if it already has fewer decimal places than context", () => {
        expect(roundToContext(0.1, 0.12)).toBe(0.1);
    });

    it ("round to context does not round value if both values and context are integers", () => {
        expect(roundToContext(5, 10)).toBe(5);
    });

    it("can flatten options", () => {

        const testData: NestedFilterOption[] = [
            {
                id: "1", label: "name1", children: [{
                    id: "2", label: "nested", children: []
                }]
            }
        ];

        const result = flattenOptions(testData);
        expect(result["1"]).toStrictEqual(testData[0]);
        expect(result["2"]).toStrictEqual({id: "2", label: "nested", children: []});
    });

    it("flatten ids returns set of selected ids", () => {

        const dict = {
            "1": {
                id: "1",
                label: "l1",
                children:
                    [{
                        id: "2",
                        label: "l2",
                        children: [{
                            id: "3",
                            label: "l3"
                        }]
                    }]
            },
            "2": {
                id: "2",
                label: "l2",
                children: [{
                    id: "3",
                    label: "l3"
                }]
            },
            "3": {
                id: "3",
                label: "l3"
            },
            "4": {
                id: "3",
                label: "l3"
            }
        };


        const result = flattenToIdSet(["1"], dict);
        expect(result).toStrictEqual(new Set(["1", "2", "3"]));
    });
});