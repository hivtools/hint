import {addCheckSum, freezer, verifyCheckSum} from "../app/utils";

describe("utils", () => {

    it("can make and verify downloadable content", () => {
        const test = {
            something: 120,
            another: {
                prop: "test"
            }
        };

        const content = addCheckSum(JSON.stringify(test));

        const resultData = JSON.parse(content);
        expect(JSON.parse(resultData[1])).toStrictEqual(test);

        const result = verifyCheckSum(content);
        expect(result).toStrictEqual(test);
    });

    it("does not verify corrupted downloadable content", () => {
        const test = "test";
        const content = addCheckSum(test);
        const resultData = JSON.parse(content);
        const corruptedContent = JSON.stringify([resultData[0], "corrupted"]);

        const result = verifyCheckSum(corruptedContent);
        expect(result).toBe(false);
    });

    it("deep freezes an object", () => {

        const data = {
            nothing: null,
            time: 10,
            name: "hello",
            items: [1, null, "three", {label: "l1"}],
            child: {
                name: "child",
                items: [4, null, "five"]
            }
        };

        const frozen = freezer.deepFreeze({...data});
        expect(frozen).toStrictEqual(data);
        expect(Object.isFrozen(frozen)).toBe(true);
        expect(Object.isFrozen(frozen.items)).toBe(true);
        expect(Object.isFrozen(frozen.child)).toBe(true);
        expect(Object.isFrozen(frozen.child.items)).toBe(true);
    });

    it("deep freezes an array", () => {

        const data = [{id: 1}, {child: {id: 2}}, 1, "hi"];

        const frozen = freezer.deepFreeze([...data]);
        expect(frozen).toStrictEqual(data);
        expect(Object.isFrozen(frozen[0])).toBe(true);
        expect(Object.isFrozen(frozen[1].child)).toBe(true);
    });

});
