import {mount} from "@vue/test-utils";
import LoadErrorModal from "../../../app/components/load/LoadErrorModal.vue"

describe("loadErrorModal", () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    const mockFunction = jest.fn()
    const mockTranslate = jest.fn()

    const errorProps = {
        hasError: false,
        loadError: "",
        clearLoadError: mockFunction,
    }

    const openErrorProps = {
        hasError: true,
        loadError: "Test Error Message",
        clearLoadError: mockFunction,
    }

    const getWrapper = (props = errorProps) => {
        return mount(LoadErrorModal, {
            props: props,
            directives: {
                translate: mockTranslate
            }
        })
    }

    it("can render error modal as expected", () => {
        const wrapper = getWrapper()
        const modal = wrapper.findComponent(".modal")
        expect(modal.attributes()).toEqual({
            class: "modal",
            style: "display: none;"
        })
    })

    it("opens error modal", () => {
        const wrapper = getWrapper(openErrorProps)
        const modal = wrapper.findComponent(".modal")
        expect(modal.attributes()).toEqual({
            class: "modal show",
            style: "display: block;",
        })
        expect(mockFunction.mock.calls.length).toBe(0)
    })

    it("can display error text and translates elements", () => {
        const wrapper = getWrapper(openErrorProps)
        const modal = wrapper.findComponent(".modal")
        expect(mockFunction.mock.calls.length).toBe(0)
        expect(modal.findComponent("p").text()).toBe("Test Error Message")

        expect(mockTranslate.mock.calls.length).toBe(2)
        expect(mockTranslate.mock.calls[0][1].value).toBe("loadError")
        expect(mockTranslate.mock.calls[1][1].value).toBe("ok")
    })

    it("trigger can invoke clearLoadError modal", async () => {
        const wrapper = getWrapper(openErrorProps)
        const okButton = wrapper.findComponent(".modal button")
        expect(okButton.attributes()).toEqual(
            {
                "aria-label": "Close",
                "class": "btn btn-red",
                "data-dismiss": "modal",
                "type": "button"
            })
        expect(mockFunction.mock.calls.length).toBe(0)
        await okButton.trigger("click")
        expect(mockFunction.mock.calls.length).toBe(1)
    })
})