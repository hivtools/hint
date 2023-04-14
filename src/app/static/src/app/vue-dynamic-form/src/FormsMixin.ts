import {defineComponent} from "vue";


interface Methods {
    [key:string]: any
    valueIsEmpty:  (value: any) => boolean
}

export default defineComponent<Record<string, any>, unknown, unknown, Record<string, any>, Methods>({
    methods: {
        valueIsEmpty(value: any) { 
            if (value && value.constructor === Array){
                return value.length === 0
            } else if (typeof(value) === 'boolean' || value === 0) {
                return false
            } else return !value
        }
    }
});