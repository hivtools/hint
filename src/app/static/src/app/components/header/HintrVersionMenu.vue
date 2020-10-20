<template>
  <drop-down :text="`v${hintrVersions.naomi}`" :right="true" style="flex: none">
    <a class="dropdown-item" href="#"> naomi: v{{ hintrVersions.naomi }} </a>
    <a class="dropdown-item" href="#"> hintr : v{{ hintrVersions.hintr }} </a>
    <a class="dropdown-item" href="#"> rrq : v{{ hintrVersions.rrq }} </a>
    <a class="dropdown-item" href="#"
      >traduire : v{{ hintrVersions.traduire }}</a
    >
  </drop-down>
</template>

<script lang="ts">
import Vue from "vue";
import { ActionMethod, mapActions } from "vuex";
import { HintrVersionResponse } from "../../generated";
import { RootState } from "../../root";
import { mapActionByName, mapStateProp } from "../../utils";
import DropDown from "./DropDown.vue";

interface Computed {
  hintrVersions: HintrVersionResponse;
}

interface Methods {
  showHintrVersion: () => void;
}

const namespace = "hintrVersion";
export default Vue.extend<{}, Methods, Computed, {}>({

  computed: {
    hintrVersions: mapStateProp<RootState, HintrVersionResponse>(
      null,
      (state: RootState) => state.hintrVersion.hintrVersion
    ),
  },

  methods: {
    showHintrVersion: mapActionByName(namespace, "getHintrVersion"),
  },

  mounted() {
    this.showHintrVersion();
  },

  components: {
    DropDown,
  },
});
</script>