import {shallowMount} from "@vue/test-utils";
import SizeLegend from "../../../../app/components/plots/bubble/SizeLegend.vue";
import {getRadius} from "../../../../app/components/plots/bubble/utils";
import {LControl} from "vue2-leaflet";
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import registerTranslations from "../../../../app/store/translations/registerTranslations";

const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const getWrapper = () => {

    return shallowMount(SizeLegend, {
        propsData: {
            minRadius: 10,
            maxRadius: 110,
            indicatorRange: {min: 1, max: 101},
            metadata: { format: '', accuracy: null, name: 'indicator'}
        }
    });
};

const expectCirclesEqual = (actual: any, expected: any) => {
    expect(Math.round(actual.y)).toBe(Math.round(expected.y));
    expect(Math.round(actual.radius)).toBe(Math.round(expected.radius));
    expect(actual.text).toBe(expected.text);
    expect(Math.round(actual.textY)).toBe(Math.round(expected.textY));
};

const expectedCircles = () => {
    const result = [];
    result.push({y: 220, radius: 10, text: "<1.175", textY: 210});

    let r = getRadius(11, 1, 101, 10, 110);
    result.push({y: 230 - r, radius: r, text: "11", textY: 230 - (2 * r)});

    r = getRadius(26, 1, 101, 10, 110);
    result.push({y: 230 - r, radius: r, text: "26", textY: 230 - (2 * r)});

    r = getRadius(51, 1, 101, 10, 110);
    result.push({y: 230 - r, radius: r, text: "51", textY: 230 - (2 * r)});

    result.push({y: 120, radius: 110, text: "101", textY: 10});

    return result;
};

describe("SizeLegend component", () => {

    it("has expected steps", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.steps).toStrictEqual([0.1, 0.25, 0.5, 1]);
    });

    it("computes width", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.width).toBe(222);
    });

    it("computes height", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.height).toBe(230);
    });

    it("computed midX", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.midX).toBe(111);
    });

    it("computes circles", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        const circles = vm.circles;
        const expected = expectedCircles();

        expect(circles.length).toBe(expected.length);
        circles.forEach((circle: any, index: number) => {
            expectCirclesEqual(circle, expected[index])
        });
    });

    it("renders as expected", () => {
        const wrapper = getWrapper();

        const label = wrapper.find("label")
        expect(label.text()).toBe("indicator");

        const lControl = wrapper.find(LControl);
        expect(lControl.props().position).toBe("bottomleft");

        const svg = lControl.find("svg");
        expect(svg.attributes().width).toBe("222");
        expect(svg.attributes().height).toBe("230");

        const expectedCirclesData = expectedCircles();

        const circles = svg.findAll("circle");
        expect(circles.length).toBe(expectedCirclesData.length);
        const texts = svg.findAll("text");
        expect(texts.length).toBe(expectedCirclesData.length);

        expectedCirclesData.forEach((circleData: any, index: number) => {
            const circle = circles.at(index);
            expect(circle.attributes().stroke).toBe("#aaa");
            expect(circle.attributes()["stroke-width"]).toBe("1");
            expect(circle.attributes()["fill-opacity"]).toBe("0");
            expect(parseFloat(circle.attributes().r)).toBeCloseTo(circleData.radius);
            expect(parseFloat(circle.attributes().cx)).toBe(111);
            expect(parseFloat(circle.attributes().cy)).toBeCloseTo(circleData.y);

            const text = texts.at(index);
            expect(text.attributes()["text-anchor"]).toBe("middle");
            expect(parseFloat(text.attributes().x)).toBe(111);
            expect(parseFloat(text.attributes().y)).toBeCloseTo(circleData.textY);
            expect(text.text()).toBe(circleData.text);
        });
    });

    it("renders text for circle with 0 value as expected", () => {
        const wrapper = shallowMount(SizeLegend, {
            propsData: {
                minRadius: 10,
                maxRadius: 110,
                indicatorRange: {min: 0, max: 0.1},
                metadata: { format: '0', accuracy: 0.1, name: 'indicator'}
            }
        });
        const zeroText = wrapper.findAll("text").at(0);
        expect(zeroText.text()).toBe("0");

    });

    it("renders large numbers as expected", () => {
        const wrapper = shallowMount(SizeLegend, {
            propsData: {
                minRadius: 10,
                maxRadius: 100,
                indicatorRange: {min: 2000, max: 10000},
                metadata: { format: '0.0', accuracy: 1, name: 'indicator'}
            }
        });

        const firstText = wrapper.findAll("text").at(0);
        expect(firstText.text()).toBe("<2.0k");

        const lastText = wrapper.findAll("text").at(4);
        expect(lastText.text()).toBe("10k");
    });
});
