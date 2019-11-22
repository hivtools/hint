import {mutations} from "../../app/store/errors/mutations";
import {ErrorsState} from "../../app/store/errors/errors";

describe("Errors mutations", () => {
    it("ErrorAdded adds error", () => {
        const testState = { errors:["First Error"] };
        mutations.ErrorAdded(testState, {type:  mutations.ErrorAdded, payload: "Second Error"});
        expect(testState.errors).toStrictEqual(["First Error", "Second Error"]);
    });

    it("DismissAll clears errors", () => {
        const testState = { errors:["First Error"] };
        mutations.DismissAll(testState, null);
        expect(testState.errors).toStrictEqual([]);
    });
});