import {roundToContext} from "../../app/store/filteredData/utils";

describe("FilteredData getters", () => {
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
});