import { s as script$2 } from "./basecomponent.esm-qug9g1zs.js";
import { B as BaseStyle } from "../server.mjs";
import { openBlock, createElementBlock, mergeProps, renderSlot } from "vue";
import "#internal/nitro";
import "ofetch";
import "hookable";
import "unctx";
import "h3";
import "unhead";
import "@unhead/shared";
import "vue-router";
import "ufo";
import "defu";
import "klona";
import "devalue";
import "destr";
import "vue/server-renderer";
var classes = {
  root: function root(_ref) {
    var instance = _ref.instance;
    return ["p-splitter-panel", {
      "p-splitter-panel-nested": instance.isNested
    }];
  }
};
var SplitterPanelStyle = BaseStyle.extend({
  name: "splitterpanel",
  classes
});
var script$1 = {
  name: "BaseSplitterPanel",
  "extends": script$2,
  props: {
    size: {
      type: Number,
      "default": null
    },
    minSize: {
      type: Number,
      "default": null
    }
  },
  style: SplitterPanelStyle,
  provide: function provide() {
    return {
      $parentInstance: this
    };
  }
};
var script = {
  name: "SplitterPanel",
  "extends": script$1,
  computed: {
    isNested: function isNested() {
      return this.$slots["default"]().some(function(child) {
        return child.type.name === "Splitter";
      });
    },
    getPTOptions: function getPTOptions() {
      return {
        context: {
          nested: this.isNested
        }
      };
    }
  }
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    ref: "container",
    "class": _ctx.cx("root")
  }, _ctx.ptm("root", $options.getPTOptions)), [renderSlot(_ctx.$slots, "default")], 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=splitterpanel.esm-gRv4lCMa.js.map
