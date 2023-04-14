# vue-dynamic-form 

[![Build Status](https://travis-ci.com/reside-ic/vue-dynamic-form.svg?branch=master)](https://travis-ci.com/reside-ic/vue-dynamic-form)

Vue component for generating a form dynamically from metadata.

## Installation
* Install from npm:
  ```
  npm install @reside-ic/vue-dynamic-form
  ```
* Import into your project and register as a global or local component:
  ```
  import {DynamicForm} from "@reside-ic/vue-dynamic-form"
  
  // global
  Vue.component("dynamic-form", DynamicForm)
  
  // or local
  new Vue({
    el: '#app',
    components: {
      DynamicForm
    }
  })
  
  ```
* Include the following css file in your app: 
    ```
    dist/css/style.min.css
    ```
    Note that this css file contains some Bootstrap styles. If you already have 
    Bootstrap in your project and don't want to duplicate style declarations you 
    can import `src/style-partial.scss` into a style bundle, but you must first include Bootstrap's
    functions, variables, mixins, forms and buttons partials for it to compile.
     
### Browser

To use the dynamic form component directly in the browser, 
just include `dist/js/vue-dynamic-form.min.js` on the page, after Vue:

```
<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
<script type="text/javascript" src="node_modules/@reside-ic/vue-dynamic-form/dist/vue-dynamic-form.min.js"></script>
```

In this case the component will be automatically registered. 
See [example/index.html](https://reside-ic.github.io/vue-dynamic-form/example/index.html).

## Usage
### Example

```
<template>
    <dynamic-form v-model="myFormMeta" 
                  @submit="handleSubmit"></dynamic-form>
</template>
<script>

export default {
    data() {
        return {
            myFormMeta: myFormMeta          
        }
    },
    methods: {
        submit(data) {
            axios.post("/my-form", data)
        }
    }
}

const myFormMeta = {   
    controlSections: [
        {
            label: "General",
            description: "Select general model options:",
            controlGroups: [
                {
                    label: "Area scope",
                    controls: [
                        {
                            name: "area_scope",
                            type: "multiselect",
                            options: [{id: "MWI", label: "Malawi"}, {id: "MWI.1", label: "Central"}],
                            value: ["MWI","MWI.1"],
                            required: true
                        }]
                },
                {
                    label: "Area level",
                    controls: [
                        {
                            name: "area_level",
                            type: "multiselect",
                            options: [{id: "q1", label: "Apr - Jun 2015"}, {id: "q2", label: "Jul - Sep 2015"}]
                        }]
                }
            ]
        },
        {
            label: "ART",
            description: "Optionally select which quarter of data to use at time point 1 and 2",
            controlGroups: [
                {
                    label: "Number on ART",
                    controls: [
                        {
                            name: "art_t1",
                            label: "Time 1",
                            type: "select",
                            value: "q1",
                            helpText: "Quarter matching midpoint of survey",
                            options: [{id: "q1", label: "Jan - Mar 2015"}, {id: "q2", label: "Apr - Jun 2015"}],
                            required: true
                        },
                        {
                            name: "art_t2",
                            label: "Time 2",
                            type: "select",
                            helpText: "Quarter matching midpoint of survey",
                            options:  [{id: "q1", label: "Jan - Mar 2015"}, {id: "q2", label: "Apr - Jun 2015"}],
                            required: false
                        }
                    ]
                }
            ]
        },
        {
            label: "Advanced options",
            controlGroups: [
                {
                    label: "Number of simulations",
                    controls: [{
                        name: "num_sim",
                        type: "number",
                        required: true
                    }]
                }
            ]
        }
    ]
}

</script>
```

On user submission the form emits a `submit` event with a payload that contains the form data as JSON. In this example,
the payload would be of the form:
```
{
    area_scope: ["MWI","MWI.1"],
    area_level: [],
    art_t1: "q1",
    art_t2: null,
    num_sim: null
}
```

See this as a working example [here](https://reside-ic.github.io/vue-dynamic-form/example/index.html)

The form also emits a `validate` event when its valid state changes. The form is valid if all controls which are `required`
 have values. The valid event provides a single boolean parameter which is `true` is the form has become valid, `false` 
 if it has become invalid. The `validate` event is also emitted when the form is mounted, indicating the initial valid state. 

### Example without v-model
If for some reason you don't want form values to be automatically updated, you can handle the change event
yourself:

```
<template>
   <dynamic-form :form-meta="myFormMeta" 
                 @change="handleChange"
                 @submit="handleSubmit"></dynamic-form>
</template>
<script>
    export default {
        data() {
            return {
                myFormMeta: myFormMeta          
            }
        },
        methods: {
            handleChange(newFormMeta) {
                this.myFormMeta = newFormMeta            
            },
            handleSubmit(data) {
                ...
            }
        }
    }
</script>
```

### Optional component props
As well as the required `v-model` or `form-meta`, you can optionally customize
the submit button text by passing `submit-text`, and the HTML element's id by 
passing `id`:

```
    <dynamic-form id="my-dynamic-form" 
                  v-model="myFormMeta"
                  @submit="handleSubmit"
                  submit-text="Validate">
    </dynamic-form>

```
You can also hide the submit button:
```

    <dynamic-form v-model="myFormMeta"
                  @submit="handleSubmit"
                  :include-submit-button="false">
    </dynamic-form>
```

Similarly, you can customize the 'required' warning text and the placeholder text 
used by the select and multi-select inputs by passing strings to the `required-text` 
and `select-text` attributes, respectively.
```

    <dynamic-form v-model="myFormMeta"
                  @submit="handleSubmit"
                  :select-text="Select an option"
                  :required-text="Compulsory">
    </dynamic-form>
```


### Control types
At the moment only 3 control types are supported:
* select
* multiselect
* number

## Testing, building and publishing
* To run unit tests with jest: `npm test`
* To build distribution files: `npm build`
* To publish to npm: 
    * first iterate the version in `package.json`
    * then `npm publish --access public`
