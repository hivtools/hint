import {router} from '../app/router';
import Stepper from "../app/components/Stepper.vue";
import Versions from "../app/components/versions/Versions.vue";

describe("Router", () => {
    it("has expected properties", () => {
        expect(router.mode).toBe("history");
        expect(router.getMatchedComponents("/")).toStrictEqual([Stepper]);
        expect(router.getMatchedComponents("/versions")).toStrictEqual([Versions]);
    });
});
