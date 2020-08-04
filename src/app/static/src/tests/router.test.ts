import {router} from '../app/router';
import Stepper from "../app/components/Stepper.vue";
import Versions from "../app/components/versions/Versions.vue";
import {app} from "../app/index";

describe("Router", () => {
    it("has expected properties", () => {
        expect(app.$router).toBe(router);
        expect(router.mode).toBe("history");
        expect(router.getMatchedComponents("/")).toStrictEqual([Stepper]);
        expect(router.getMatchedComponents("/versions")).toStrictEqual([Versions]);
    });
});
