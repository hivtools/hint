import {shallowMount} from "@vue/test-utils";
import SizeLegend from "../../../../app/components/plots/bubble/SizeLegend.vue";
import {getRadius} from "../../../../app/components/plots/bubble/utils";
import {LControl} from "vue2-leaflet";

const getWrapper  = () => {

    return shallowMount(SizeLegend, {propsData: {
            minRadius: 10,
            maxRadius: 110,
            indicatorRange: {min: 1, max: 101}
        }
    });
};

const expectCirclesEqual = (actual: any, expected: any) => {
    expect(Math.round(actual.x)).toBe(Math.round(expected.x));
    expect(Math.round(actual.y)).toBe(Math.round(expected.y));
    expect(Math.round(actual.radius)).toBe(Math.round(expected.radius));
    expect(actual.text).toBe(expected.text);
    expect(Math.round(actual.textX)).toBe(Math.round(expected.textX));
    expect(Math.round(actual.textY)).toBe(Math.round(expected.textY));
};

const expectedCircles = () => {
    const result = [];
    result.push({x: 111,  y: 220, radius: 10, text: "<1.18", textX: 111, textY: 210});

    let r = getRadius(26, 1, 101, 10, 110);
    result.push({x: 111,  y: 230-r, radius: r, text: "26.00", textX: 111, textY: 230-(2*r)});

    r = getRadius(51, 1, 101, 10, 110);
    result.push({x: 111,  y: 230-r, radius: r, text: "51.00", textX: 111, textY: 230-(2*r)});

    r = getRadius(76, 1, 101, 10, 110);
    result.push({x: 111,  y: 230-r, radius: r, text: "76.00", textX: 111, textY: 230-(2*r)});

    result.push({x: 111,  y: 120, radius: 110, text: "101.00", textX: 111, textY: 10});

    return result;
};

describe("SizeLegend component", () => {

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
            expect(parseFloat(circle.attributes().cx)).toBeCloseTo(circleData.x);
            expect(parseFloat(circle.attributes().cy)).toBeCloseTo(circleData.y);

            const text = texts.at(index);
            expect(text.attributes()["text-anchor"]).toBe("middle");
            expect(parseFloat(text.attributes().x)).toBeCloseTo(circleData.textX);
            expect(parseFloat(text.attributes().y)).toBeCloseTo(circleData.textY);
            expect(text.text()).toBe(circleData.text);
        });
    });

    it("renders text for circle with 0 value as expected", () => {
        const wrapper =  shallowMount(SizeLegend, {propsData: {
                minRadius: 10,
                maxRadius: 110,
                indicatorRange: {min: 0, max: 1}
            }
        });
        const zeroText = wrapper.findAll("text").at(0);
        expect(zeroText.text()).toBe("0");

    });
});