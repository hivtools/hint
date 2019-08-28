import {api} from "../app/apiService";
import {Failure} from "../app/generated";

describe("ApiService", () => {

    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear()
    });

    it("console logs error", () => {
        const error = {detail: "missing parameter", error: "OTHER_ERROR"};
        const e = {errors: [error]} as Partial<Failure>;
        try {
            api.handleError({response: {data: e}} as any);
        } catch (e) {

        }
        expect((console.log as jest.Mock).mock.calls[0][0][0]).toStrictEqual(error);
    });

    it("rethrows simple error", () => {
        const error = {detail: "missing parameter", error: "OTHER_ERROR"};
        const e = {errors: [error]} as Partial<Failure>;
        try {
            api.handleError({response: {data: e}} as any);
        } catch (e) {
            expect(e.message).toBe("missing parameter");
        }
    })
});
